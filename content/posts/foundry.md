---
title: "Foundry：Solidity 智能合约本地开发、测试与部署指南"
date: 2025-11-19T08:30:00+08:00
categories: ["技术", "web3"]
tags: ["foundry", "solidity", "ethereum", "web3", "blockchain"]
---

## 前言

最近在使用Foundry开发智能合约，发现它相较于传统的Hardhat或Truffle工具链确实有明显的优势。Foundry是由Paradigm团队开发的Ethereum智能合约开发工具包，基于Rust构建，包括四个核心组件：**forge**（编译、测试与部署）、**cast**（链上交互）、**anvil**（本地节点模拟）和**chisel**（Solidity REPL）。特别值得一提的是，它支持原生Solidity测试，无需JavaScript，同时还有模糊测试（fuzzing）支持，性能也相当出色。

最近正好在研究Foundry v0.2.0+版本（Rust 1.80+），结合官方文档和社区实践，总结了以下本地开发、测试与部署的完整流程，分享给大家。

## 1. 安装与项目初始化

### 1.1 安装 Foundry

安装Foundry非常简单，使用官方的`foundryup`脚本即可：

```bash
# 安装 foundryup
curl -L https://github.com/foundry-rs/foundry/releases/latest/download/foundryup-installer.sh | bash

# 安装 Foundry 工具链（forge, cast, anvil, chisel）
foundryup

# 验证安装
foundry --version  # 输出类似: forge 0.2.0 (abc1234 2025-11-01)
anvil --version
cast --version
```

**个人建议**：
- 在项目中使用`foundry.toml`配置来锁定版本，避免更新带来的兼容性问题。
- CI/CD中可以使用`foundryup -i`来确保环境一致性。

### 1.2 创建新项目

Foundry项目结构非常简洁，主要包含：`src/`（合约源代码）、`test/`（测试）、`script/`（部署脚本）、`lib/`（依赖）：

```bash
# 初始化新项目
forge init my-project
cd my-project

# 项目结构
ls
# 输出: foundry.toml  lib/  script/  src/  test/
```

- `src/Counter.sol`：默认示例合约（简单计数器）
- `test/Counter.t.sol`：默认测试文件（`.t.sol` 后缀表示测试）
- `foundry.toml`：配置文件（可自定义 Solidity 版本、优化器等）

**示例配置文件**（`foundry.toml`）：
```toml
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
solc_version = "0.8.27"
optimizer = true
optimizer_runs = 200
via_ir = true  # 启用 Intermediate Representation 优化（提高 Gas 效率）
```

### 1.3 本地开发工作流

- **编写合约**：在`src/`下创建Solidity文件。Foundry支持OpenZeppelin等库，通过Git子模块管理依赖（无需npm）。

  举个例子：扩展`Counter.sol`为ERC20代币（`src/MyToken.sol`）：
  ```solidity
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.27;

  import "forge-std/console.sol";  // Foundry 内置日志库

  contract MyToken {
      string public name = "MyToken";
      mapping(address => uint256) public balanceOf;

      function mint(address to, uint256 amount) external {
          balanceOf[to] += amount;
          console.log("Minted %d tokens to %s", amount, to);  // 调试日志
      }
  }
  ```

- **安装依赖**：
  ```bash
  # 添加 OpenZeppelin（Git 子模块）
  forge install OpenZeppelin/openzeppelin-contracts@v5.0.0

  # 更新 remappings（自动生成 .solc-remappings.json）
  forge remappings > remappings.txt
  ```

- **编译合约**：
  ```bash
  forge build  # 编译 src/ 下所有 .sol 文件，输出到 out/
  # 或指定优化
  forge build --optimize --optimize-runs 1000000
  ```

**调试小技巧**：
- 使用`chisel`进行交互式测试：
  ```bash
  chisel  # 启动 REPL，输入 Solidity 代码实时执行
  > uint256 x = 42; console.log(x);  # 输出: 42
  ```
- 使用`forge build --gas-report`生成Gas使用报告。

## 2. 测试智能合约

Foundry 的测试框架（Forge）允许用 Solidity 编写测试，支持模糊测试（fuzzing）、作弊码（cheatcodes，如 `vm.prank` 模拟调用者）和断言（`assertEq`）。测试文件置于 `test/`，继承 `Test.sol`。

### 2.1 编写测试

示例：为 `MyToken` 编写全面测试（`test/MyToken.t.sol`）：
```solidity
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.27;

import "forge-std/Test.sol";
import "../src/MyToken.sol";

contract MyTokenTest is Test {
    MyToken token;
    address user = makeAddr("user");  // 生成测试地址

    function setUp() public {
        token = new MyToken();
        deal(address(token), 1000 ether);  // 作弊码：注入 ETH（模拟余额）
    }

    // 基本断言测试
    function testName() public {
        assertEq(token.name(), "MyToken");
    }

    // 集成测试：铸币与余额检查
    function testMint() public {
        vm.prank(user);  // 作弊码：模拟 user 调用
        token.mint(user, 100);

        assertEq(token.balanceOf(user), 100);
    }

    // 模糊测试：随机输入验证（fuzzing，覆盖边缘案例）
    function testMintFuzz(uint256 amount) public {
        vm.assume(amount > 0 && amount < type(uint256).max / 2);  // 假设边界
        vm.prank(user);
        token.mint(user, amount);
        assertEq(token.balanceOf(user), amount);
    }

    // 失败案例测试（expectRevert）
    function testMintFail() public {
        vm.expectRevert();  // 预期回滚
        vm.prank(address(0));  // 零地址调用（假设无权限）
        token.mint(user, 100);
    }
}
```

**关键概念**：
- **setUp()**：每个测试前执行（类似于Mocha的beforeEach）
- **作弊码（Cheatcodes）**：`vm`实例提供EVM操纵，如`vm.prank`（伪造msg.sender）、`vm.deal`（注入余额）、`vm.warp`（时间戳跳跃）
- **模糊测试**：`testMintFuzz(uint256 amount)`自动生成数千随机输入，检测溢出/边界问题

### 2.2 运行测试

```bash
# 运行所有测试
forge test

# 详细输出 + Gas 报告
forge test -vvv --gas-report

# 运行特定测试
forge test --match-test testMint

# 模糊测试（增加迭代次数）
forge test --fuzz-runs 10000

# 覆盖率报告
forge coverage --report lcov  # 生成 LCOV 报告，可集成 SonarQube
```

**输出示例**（成功测试）：
```
[PASS] testMint() (gas: 25000)
[FAIL] testMintFail() (gas: 15000)  # 预期失败
Coverage: 95.2% lines, 88.5% branches
```

**个人经验**：
- 测试覆盖率尽量保持在90%以上（使用`forge coverage`）
- 每个`test*`函数保持独立，互不影响
- 重点关注边界情况：零值、最大值、重入（reentrancy）

## 3. 部署智能合约

部署主要通过Forge的脚本系统（`script/`下的Solidity脚本）来完成，也支持CLI方式。支持本地（Anvil）、测试网（Sepolia）和主网部署。

### 3.1 启动本地节点（Anvil）

Anvil是Foundry的本地EVM模拟器，提供10个预资助账户（每个10000 ETH）：

```bash
# 启动 Anvil（默认 RPC: http://127.0.0.1:8545）
anvil

# 输出: Accounts (10): 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
#       Listener: http://127.0.0.1:8545
```

- **Fork 模式**：可以模拟真实网络（如Sepolia fork）：
  ```bash
  anvil --fork-url https://rpc.sepolia.org --fork-block-number 5000000
  ```

### 3.2 编写部署脚本

在`script/Deploy.s.sol`中：
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import "forge-std/Script.sol";
import "../src/MyToken.sol";

contract DeployToken is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");  // 从环境变量加载
        vm.startBroadcast(deployerPrivateKey);

        MyToken token = new MyToken();
        console.log("Deployed at: %s", address(token));

        vm.stopBroadcast();
    }
}
```

### 3.3 执行部署

```bash
# 设置环境变量
export PRIVATE_KEY=your_private_key_here  # 测试网私钥（勿用主网）

# 本地部署（Anvil）
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# 测试网部署（Sepolia）
forge script script/Deploy.s.sol --rpc-url https://rpc.sepolia.org --broadcast --verify  # --verify 自动验证 Etherscan

# 输出示例
[⠒] Compiling...
[⠔] Broadcasting...
Transaction successful: 0xabc123... (Block Confirmation: 1)
Deployed at: 0x1234567890abcdef...
```

**链上交互（Cast）**：
部署后，使用 Cast 调用合约：
```bash
# 调用 mint 函数
cast send 0x1234567890abcdef "mint(address,uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 "100" --private-key $PRIVATE_KEY --rpc-url http://127.0.0.1:8545

# 查询余额
cast call 0x1234567890abcdef "balanceOf(address)(uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://127.0.0.1:8545
# 输出: 100
```

### 3.4 多链与升级部署
- **配置多链**：在`foundry.toml`添加`[etherscan]`部分，支持自动验证
- **代理升级**：集成OpenZeppelin Upgrades插件（`forge install OpenZeppelin/openzeppelin-upgrades-flattener`）

**个人经验**：
- 使用`--slow`标志运行完整测试套件（包括Gas基准测试）
- CI/CD中使用GitHub Actions（测试+部署到测试网）
- 安全方面：私钥通过环境变量或`DOTENV`加载；生产前运行`slither .`静态分析

## 最后

最近使用Foundry开发了一些项目，确实感觉比传统的Hardhat工具链效率更高。特别是原生Solidity测试和作弊码功能很大程度上简化了开发流程，模糊测试也提供了更全面的测试覆盖。

**进一步阅读**：
- 官方手册：https://book.getfoundry.sh/
- 示例项目：ethereum-blockchain-developer.com 的 ERC721 教程
- 高级测试：Metana 的 Foundry 测试指南
- 社区：Foundry Discord / GitHub (foundry-rs/foundry)