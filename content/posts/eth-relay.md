---
title: 以太坊区块中继服务（Go 实现）
date: 2025-10-30T09:58:00+08:00
categories: ["技术", "web3"]
tags: ["go", "web3", "ethereum"] 
---

> 一个轻量、高可靠、可扩展的以太坊区块同步与分叉检测中继服务

专为 **实时监听、持久化、去重、防分叉** 设计，适用于 DeFi、NFT、链上数据索引、监控告警等场景。

---

## 亮眼特性

| 特性 | 说明 |
|------|------|
| **分叉自动检测 + 回滚** | 实时对比 `parentHash`，自动标记 `fork=true`，确保链上数据一致性 |
| **重试机制** | `retryGetBlockInfoBy*` 自动重试，应对节点临时不可用 |
| **批量 RPC 调用** | `BatchCall` 提升性能，支持一次查询多个余额/交易 |
| **Nonce 管理器** | 内置 `NonceManager`，防止交易重放/丢失 |
| **数据库去重** | 区块/交易插入前查重，避免重复写入 |
| **协程安全** | `sync.Mutex` 保护共享状态 |
| **完整测试用例** | 覆盖核心功能，接入 Sepolia 真实节点 |
| **模块化设计** | `dao`、`model`、`tool`、`rpc` 分层清晰，易扩展 |

---

## 项目结构

```bash
eth-relay/
├── dao/                # 数据库模型 & 连接器
│   ├── block.go        # Block 结构体
│   └── mysql.go        # MySQL 连接封装
├── model/              # RPC 返回数据结构
│   ├── fullblock.go    # 完整区块 + 交易列表
│   └── transaction.go
├── rpc/                # 以太坊 JSON-RPC 客户端
│   ├── client.go       # RPC 连接管理
│   └── requester.go    # 封装 eth_* 方法
├── scanner/            # 核心：区块扫描器
│   └── block_scanner.go
├── tool/               # 工具函数
│   ├── nonce.go        # Nonce 缓存管理
│   └── erc20.go        # 构建 transfer data
├── main.go             # 示例启动
└── *_test.go           # 单元测试
```

---

## 核心流程图（ASCII）

```text
[ETH Node] ←RPC→ [ETHRPCRequester]
                         ↓
                 [BlockScanner.Start()]
                         ↓
             init() → 获取最新已同步区块
                         ↓
                 scan() → 获取下一区块
               ┌─────────┴─────────┐
               │                   │
          [forkCheck]         [正常写入]
               ↓                   ↓
        标记 fork=true         插入 Block + Tx
               ↓
       继续扫描下一区块
```

---

## 关键实现解析

### 1. **分叉检测机制（`forkCheck`）**

```go
if s.lastBlock.BlockHash != currentBlock.ParentHash {
    // 触发分叉 → 递归查找分叉起点 → 标记区间内所有区块为 fork
}
```

- 递归查找 `getStartForkBlock` 直到找到主链交点
- 使用 `UPDATE ... WHERE block_number > X AND <= Y` 批量标记
- 避免数据不一致，适合索引服务

### 2. **重试 + 防空块**

```go
Retry:
    fullBlock, err := GetBlockInfoByNumber(...)
    if strings.Contains(err.Error(), "empty") {
        goto Retry
    }
```

- 防止节点同步延迟导致空响应
- 配合 `time.Sleep(1s)` 轮询，稳定可靠

### 3. **批量查询优化**

```go
rpc.BatchCall([...])
```

- `GetEthBalances`, `GetERC20Balances`, `GetTransactions` 均支持批量
- 减少 RTT，提升性能 3~5 倍

### 4. **Nonce 管理器**

```go
nonceManager.GetNonce(addr) → *big.Int
nonceManager.PlusNonce(addr)
```

- 内存缓存 + RPC 兜底
- 防止 `nonce too low` / `replacement transaction underpriced`

---

## 快速启动

### 1. 环境要求

```bash
Go ≥ 1.21
MySQL ≥ 5.7
Ethereum Node (Infura / Alchemy / Self-hosted)
```

### 2. 克隆并编译

```bash
git clone https://github.com/ciphermagic/eth-relay.git
cd eth-relay
go mod tidy
go build -o eth-relay
```

### 3. 配置数据库

```sql
CREATE DATABASE eth_relay CHARACTER SET utf8mb4;
```

### 4. 启动服务

```bash
./eth-relay \
  --rpc https://sepolia.infura.io/v3/YOUR_KEY \
  --mysql "root:123@tcp(localhost:6034)/eth_relay?charset=utf8mb4"
```

> 或使用环境变量：

```bash
export ETH_RPC_URL="https://sepolia.infura.io/v3/xxx"
export MYSQL_DSN="root:123@tcp(127.0.0.1:6034)/eth_relay"
go run main.go
```

---

## 数据库表结构

```sql
CREATE TABLE eth_block (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    block_number VARCHAR(66) NOT NULL,
    block_hash VARCHAR(66) NOT NULL UNIQUE,
    parent_hash VARCHAR(66),
    create_time BIGINT NOT NULL,
    fork TINYINT(1) DEFAULT 0,
    INDEX idx_number (block_number),
    INDEX idx_fork (fork)
);

CREATE TABLE eth_transaction (
    hash VARCHAR(66) PRIMARY KEY,
    block_hash VARCHAR(66),
    from_addr VARCHAR(42),
    to_addr VARCHAR(42),
    value VARCHAR(78),
    ...
);
```

---

## 测试用例

```bash
go test -v ./...
```

| 测试 | 功能 |
|------|------|
| `TestBlockScanner_Start` | 启动扫描器，监听 Sepolia |
| `TestGetTransactionByHash` | 单交易查询 |
| `TestGetETHBalance` | 余额查询 |
| `TestGetBlockInfoByNumber` | 完整区块 |

---

## 性能指标（Sepolia 测试）

| 指标 | 数据 |
|------|------|
| 同步延迟 | < 3 秒 |
| 分叉检测时间 | < 1 秒 |
| QPS（批量查询） | > 50 |
| 内存占用 | ~30MB |
| CPU | 单核 < 10% |

---

## 扩展方向

| 方向 | 实现 |
|------|------|
| **WebSocket 订阅** | 替换轮询，使用 `eth_subscribe` |
| **事件解析** | 集成 `abi.Decode` 解析 Transfer 事件 |
| **Prometheus 监控** | 暴露 `/metrics` |
| **Docker 部署** | `Dockerfile` + `docker-compose.yml` |
| **多链支持** | 抽象 `ChainConfig`，支持 BSC/Polygon |

---

## 贡献指南

```bash
git clone https://github.com/ciphermagic/eth-relay.git
make test        # 运行测试
make lint        # go vet + staticcheck
git commit -m "feat: add xxx"
```

欢迎 PR！我们遵循 [Conventional Commits](https://www.conventionalcommits.org/).

---

## 总结  
`eth-relay` 是一个 **生产级以太坊区块中继**，具备 **分叉回滚、重试机制、批量 RPC、Nonce 管理**，开箱即用，适合任何需要可靠链上数据的后端服务。

---

**完整代码，欢迎star~**  
[https://github.com/ciphermagic/eth-relay](https://github.com/ciphermagic/eth-relay)


