---
title: RWA 实操指南（三）：流动性提供与用户交互，完成生态闭环
date: 2025-11-12T11:58:00+08:00
categories: ["技术", "web3"]
tags: ["go", "web3", "rwa", "solidity"] 
---

在前两篇中，我们从资产基础到数据与收益机制构建了RWA的核心框架。本篇作为系列收尾，将聚焦第五步和第六步：流动性提供以及用户交互界面开发。这些环节将RWA从技术原型转向实际应用，完成生态闭环。

### 第五步：提供流动性  
在代币正式上线前，需在Uniswap V3等去中心化交易所建立流动性池。流动性池配置为目标RWA代币与稳定币（如USDC）的交易对。为提高资本效率并降低无常损失风险，建议采用Uniswap V3的集中流动性机制，将主要流动性区间设置在1:1锚定值附近（如0.95-1.05的价格范围），以确保在正常交易场景下获得最大交易效率。

```go
// go代码：RWA流动性管理系统 - Uniswap V3集成
package main

import (
	"crypto/ecdsa"
	"errors"
	"fmt"
	"math/big"
	"time"

	// 注意：实际使用时需要导入以太坊相关包
	// "github.com/ethereum/go-ethereum"
	// "github.com/ethereum/go-ethereum/common"
	// "github.com/ethereum/go-ethereum/crypto"
)

// Token 代币信息结构
type Token struct {
	Address     string  // 代币合约地址
	Symbol      string  // 代币符号
	Decimals    uint8   // 小数位数
	TotalSupply *big.Int // 总供应量
	Name        string  // 代币名称
}

// PoolFee Uniswap V3支持的费率
type PoolFee int

const (
	Fee0_01    PoolFee = 100    // 0.01%
	Fee0_05    PoolFee = 500    // 0.05%
	Fee0_3     PoolFee = 3000   // 0.3%
	Fee1       PoolFee = 10000  // 1%
)

// TickRange 集中流动性的价格区间
type TickRange struct {
	LowerTick int // 下界价格刻度
	UpperTick int // 上界价格刻度
}

// Pool Uniswap V3 流动性池
type Pool struct {
	Address       string   // 池合约地址
	Token0        Token    // 代币0
	Token1        Token    // 代币1
	Fee           PoolFee  // 交易费率
	Liquidity     *big.Int // 当前流动性
	SqrtRatioX96  *big.Int // 当前价格的sqrt值乘以2^96
}

// Position 流动性头寸
type Position struct {
	Owner         string   // 头寸所有者
	Token0Amount  *big.Int // 投入的token0数量
	Token1Amount  *big.Int // 投入的token1数量
	TickRange     TickRange // 价格区间
	FeeGrowthInside *big.Int // 已累计的手续费增长
	Liquidity     *big.Int // 提供的流动性
}

// LiquidityManager 流动性管理接口
type LiquidityManager interface {
	CreatePool(token0, token1 Token, fee PoolFee) (*Pool, error)
	MintPosition(pool *Pool, owner string, token0Amount, token1Amount *big.Int, tickRange TickRange) (*Position, error)
	CollectFees(position *Position) (*big.Int, *big.Int, error)
	IncreaseLiquidity(position *Position, token0Amount, token1Amount *big.Int) error
}

// UniswapManager Uniswap V3流动性管理器实现
type UniswapManager struct {
	Pools     map[string]*Pool
	Positions map[string]*Position
	ChainID   *big.Int
}

// NewUniswapManager 创建新的Uniswap管理器
func NewUniswapManager(chainID *big.Int) *UniswapManager {
	return &UniswapManager{
		Pools:     make(map[string]*Pool),
		Positions: make(map[string]*Position),
		ChainID:   chainID,
	}
}

// GeneratePoolAddress 生成池地址（模拟）
func GeneratePoolAddress(token0, token1 Token, fee PoolFee) string {
	// 实际实现中应使用Uniswap V3工厂合约的create2逻辑
	return fmt.Sprintf("0x%s%040x", token0.Address[:8], token1.Address[:8])[:42]
}

// CreatePool 创建Uniswap V3流动性池
func (m *UniswapManager) CreatePool(token0, token1 Token, fee PoolFee) (*Pool, error) {
	// 验证代币地址
	if token0.Address == "" || token1.Address == "" {
		return nil, errors.New("无效的代币地址")
	}
	
	if token0.Address == token1.Address {
		return nil, errors.New("不能为相同代币创建交易对")
	}
	
	// 确保token0的地址小于token1的地址（Uniswap V3要求）
	if token0.Address > token1.Address {
		token0, token1 = token1, token0
	}
	
	// 生成池地址
	poolAddress := GeneratePoolAddress(token0, token1, fee)
	
	// 检查是否已存在
	if _, exists := m.Pools[poolAddress]; exists {
		return nil, fmt.Errorf("池 %s 已存在", poolAddress)
	}
	
	// 创建池
	pool := &Pool{
		Address:      poolAddress,
		Token0:       token0,
		Token1:       token1,
		Fee:          fee,
		Liquidity:    big.NewInt(0),
		SqrtRatioX96: big.NewInt(0), // 初始为0，首次添加流动性时设置
	}
	
	m.Pools[poolAddress] = pool
	
	fmt.Printf("成功创建Uniswap V3池: %s\n", poolAddress)
	fmt.Printf("交易对: %s (%s) / %s (%s)\n", 
		token0.Symbol, token0.Address, 
		token1.Symbol, token1.Address)
	fmt.Printf("费率: %.4f%%\n", float64(fee)/10000)
	
	return pool, nil
}

// MintPosition 添加流动性头寸
func (m *UniswapManager) MintPosition(pool *Pool, owner string, token0Amount, token1Amount *big.Int, tickRange TickRange) (*Position, error) {
	if pool == nil {
		return nil, errors.New("池不存在")
	}
	
	if tickRange.LowerTick >= tickRange.UpperTick {
		return nil, errors.New("价格区间无效：下界必须小于上界")
	}
	
	// 模拟创建头寸ID
	positionID := fmt.Sprintf("POS-%d", time.Now().UnixNano())
	
	// 创建头寸
	position := &Position{
		Owner:         owner,
		Token0Amount:  token0Amount,
		Token1Amount:  token1Amount,
		TickRange:     tickRange,
		FeeGrowthInside: big.NewInt(0),
		Liquidity:     big.NewInt(1000000), // 模拟流动性值
	}
	
	m.Positions[positionID] = position
	
	// 更新池流动性
	pool.Liquidity.Add(pool.Liquidity, position.Liquidity)
	
	fmt.Printf("成功添加流动性头寸: %s\n", positionID)
	fmt.Printf("所有者: %s\n", owner)
	fmt.Printf("提供的流动性: %s %s, %s %s\n", 
		token0Amount.String(), pool.Token0.Symbol,
		token1Amount.String(), pool.Token1.Symbol)
	fmt.Printf("价格区间: tick %d 至 tick %d\n", 
		tickRange.LowerTick, tickRange.UpperTick)
	
	return position, nil
}

// CollectFees 收取手续费
func (m *UniswapManager) CollectFees(position *Position) (*big.Int, *big.Int, error) {
	// 模拟计算手续费
	token0Fees := new(big.Int).Div(position.Token0Amount, big.NewInt(100)) // 模拟1%的手续费
	token1Fees := new(big.Int).Div(position.Token1Amount, big.NewInt(100))
	
	return token0Fees, token1Fees, nil
}

// IncreaseLiquidity 增加流动性
func (m *UniswapManager) IncreaseLiquidity(position *Position, token0Amount, token1Amount *big.Int) error {
	position.Token0Amount.Add(position.Token0Amount, token0Amount)
	position.Token1Amount.Add(position.Token1Amount, token1Amount)
	position.Liquidity.Add(position.Liquidity, big.NewInt(500000)) // 模拟增加流动性
	return nil
}

// CalculateOptimalTicks 计算优化的价格区间刻度
func CalculateOptimalTicks(basePrice float64, percentRange float64) TickRange {
	// 简化的tick计算，实际应根据Uniswap V3的tickSpacing规则计算
	// 这里假设在1%范围内集中流动性
	lowerPrice := basePrice * (1 - percentRange)
	upperPrice := basePrice * (1 + percentRange)
	
	// 简化的tick计算
	lowerTick := int(lowerPrice*1000) - 887220 // 偏移量模拟
	upperTick := int(upperPrice*1000) - 887220
	
	return TickRange{
		LowerTick: lowerTick,
		UpperTick: upperTick,
	}
}

func main() {
	// 创建Uniswap管理器
	manager := NewUniswapManager(big.NewInt(1)) // 主网
	
	// 定义代币
	rwaToken := Token{
		Address:     "0x1234567890123456789012345678901234567890",
		Symbol:      "RWA",
		Decimals:    18,
		TotalSupply: big.NewInt(10000000 * 1e18), // 1000万枚
		Name:        "中关村租金收益代币",
	}
	
	usdcToken := Token{
		Address:     "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
		Symbol:      "USDC",
		Decimals:    6,
		TotalSupply: big.NewInt(5000000000 * 1e6), // 50亿枚
		Name:        "USD Coin",
	}
	
	// 创建流动性池
	pool, err := manager.CreatePool(rwaToken, usdcToken, Fee0_3)
	if err != nil {
		fmt.Printf("创建池失败: %v\n", err)
		return
	}
	
	// 计算优化的价格区间 (当前价格约1美元，在0.95-1.05区间集中流动性)
	tickRange := CalculateOptimalTicks(1.0, 0.05) // 5%价格范围
	
	// 添加流动性
	owner := "0xabcdef1234567890abcdef1234567890abcdef123"
	token0Amount := new(big.Int).Mul(big.NewInt(500000), new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(rwaToken.Decimals)), nil))
	token1Amount := new(big.Int).Mul(big.NewInt(500000), new(big.Int).Exp(big.NewInt(10), big.NewInt(int64(usdcToken.Decimals)), nil))
	
	position, err := manager.MintPosition(pool, owner, token0Amount, token1Amount, tickRange)
	if err != nil {
		fmt.Printf("添加流动性失败: %v\n", err)
		return
	}
	
	// 模拟收取手续费
	token0Fees, token1Fees, _ := manager.CollectFees(position)
	fmt.Printf("\n预计可收取手续费:\n %s %s\n %s %s\n", 
		token0Fees.String(), rwaToken.Symbol,
		token1Fees.String(), usdcToken.Symbol)
	
	fmt.Println("\n流动性管理提示:")
	fmt.Println("1. RWA代币建议在窄价格区间(±5%)提供流动性，减少无常损失")
	fmt.Println("2. 定期调整价格区间以适应当前市场价格")
	fmt.Println("3. 考虑使用自动做市策略管理流动性")
}
```

### 第六步：用户前端交互  
构建资产管理API服务层，实现与前端应用的无缝集成。服务端采用Go语言开发高性能REST API，支持与多种前端界面的交互，提供实时资产持仓查询、收益追踪、分红管理等核心功能。系统架构包含数据持久化层、业务逻辑层和API接口层，支持多用户并发访问，确保数据一致性和系统安全性。

```go
// go代码：RWA资产管理API服务
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

// AssetHoldings 用户资产持仓
type AssetHoldings struct {
	AssetID       string  `json:"asset_id"`
	TokenSymbol   string  `json:"token_symbol"`
	TokenName     string  `json:"token_name"`
	Holdings      float64 `json:"holdings"`      // 持仓数量
	HoldingsValue float64 `json:"holdings_value"` // 持仓价值(USD)
	APY           float64 `json:"apy"`           // 年化收益率
}

// UserPortfolio 用户投资组合
type UserPortfolio struct {
	UserAddress     string         `json:"user_address"`
	TotalValue      float64        `json:"total_value"`      // 总资产价值
	TotalYield      float64        `json:"total_yield"`      // 累计收益
	UnclaimedYield  float64        `json:"unclaimed_yield"`  // 未领取收益
	AssetHoldings   []AssetHoldings `json:"asset_holdings"`   // 资产持仓列表
	LastUpdated     time.Time      `json:"last_updated"`     // 最后更新时间
}

// AssetPerformance 资产表现数据
type AssetPerformance struct {
	AssetID        string    `json:"asset_id"`
	CurrentPrice   float64   `json:"current_price"`   // 当前价格
	PriceChange24h float64   `json:"price_change_24h"` // 24小时价格变化
	Volume24h      float64   `json:"volume_24h"`      // 24小时交易量
	LastYieldDate  time.Time `json:"last_yield_date"` // 上次分红日期
	NextYieldDate  time.Time `json:"next_yield_date"` // 下次分红日期
}

// DistributionEvent 分红事件
type DistributionEvent struct {
	EventID        string    `json:"event_id"`
	AssetID        string    `json:"asset_id"`
	DistributionDate time.Time `json:"distribution_date"`
	AmountPerToken float64   `json:"amount_per_token"` // 每单位代币分红金额
	TotalDistribution float64 `json:"total_distribution"` // 总分红金额
	Status         string    `json:"status"`         // 状态：scheduled/completed/failed
}

// YieldHistory 收益历史记录
type YieldHistory struct {
	Timestamp time.Time `json:"timestamp"`
	Amount    float64   `json:"amount"`
	EventType string    `json:"event_type"` // distribution/claim/reinvestment
}

// ErrorResponse 错误响应
type ErrorResponse struct {
	Error   string `json:"error"`
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// RWAAPIServer RWA资产管理API服务器
type RWAAPIServer struct {
	DB          *sql.DB
	Router      *mux.Router
	Server      *http.Server
	EthClient   interface{} // 以太坊客户端接口
	Port        string
}

// NewRWAAPIServer 创建新的API服务器
func NewRWAAPIServer(port string) (*RWAAPIServer, error) {
	// 初始化数据库
	db, err := initDB()
	if err != nil {
		return nil, fmt.Errorf("初始化数据库失败: %w", err)
	}

	// 创建路由器
	router := mux.NewRouter()
	
	// 创建服务器实例
	server := &RWAAPIServer{
		DB:     db,
		Router: router,
		Port:   port,
	}

	// 设置路由
	server.setupRoutes()

	// 配置HTTP服务器
	server.Server = &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	return server, nil
}

// 初始化数据库（使用SQLite模拟）
func initDB() (*sql.DB, error) {
	// 在实际应用中，应该连接到生产级数据库
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		return nil, err
	}

	// 创建表（模拟）
	_, err = db.Exec(`
		CREATE TABLE IF NOT EXISTS users (
			address TEXT PRIMARY KEY,
			total_value REAL,
			total_yield REAL,
			unclaimed_yield REAL,
			last_updated TIMESTAMP
		);
		CREATE TABLE IF NOT EXISTS asset_holdings (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_address TEXT,
			asset_id TEXT,
			token_symbol TEXT,
			token_name TEXT,
			holdings REAL,
			holdings_value REAL,
			apy REAL,
			FOREIGN KEY(user_address) REFERENCES users(address)
		);
		CREATE TABLE IF NOT EXISTS yield_history (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			user_address TEXT,
			timestamp TIMESTAMP,
			amount REAL,
			event_type TEXT,
			FOREIGN KEY(user_address) REFERENCES users(address)
		);
	`)

	// 插入模拟数据
	_, err = db.Exec(`
		INSERT OR IGNORE INTO users (address, total_value, total_yield, unclaimed_yield, last_updated)
		VALUES ('0x1234567890abcdef1234567890abcdef123456789', 15000.0, 1050.0, 350.0, datetime('now'));
		
		INSERT OR IGNORE INTO asset_holdings (user_address, asset_id, token_symbol, token_name, holdings, holdings_value, apy)
		VALUES 
		('0x1234567890abcdef1234567890abcdef123456789', 'ASSET-RE-2025-001', 'RWA-RENT', '中关村租金收益代币', 5000.0, 5000.0, 0.07),
		('0x1234567890abcdef1234567890abcdef123456789', 'ASSET-RE-2025-002', 'RWA-COMM', '商业区收益代币', 10000.0, 10000.0, 0.065);
		
		INSERT OR IGNORE INTO yield_history (user_address, timestamp, amount, event_type)
		VALUES
		('0x1234567890abcdef1234567890abcdef123456789', datetime('now', '-30 days'), 175.0, 'distribution'),
		('0x1234567890abcdef1234567890abcdef123456789', datetime('now', '-20 days'), 175.0, 'claim'),
		('0x1234567890abcdef1234567890abcdef123456789', datetime('now', '-10 days'), 325.0, 'distribution'),
		('0x1234567890abcdef1234567890abcdef123456789', datetime('now'), 375.0, 'distribution');
	`)

	return db, err
}

// 设置路由
func (s *RWAAPIServer) setupRoutes() {
	// 添加CORS中间件
	s.Router.Use(corsMiddleware)
	
	// API版本组
	v1 := s.Router.PathPrefix("/api/v1").Subrouter()

	// 用户相关路由
	v1.HandleFunc("/portfolio/{address}", s.getPortfolioHandler).Methods("GET")
	v1.HandleFunc("/portfolio/{address}/yield/history", s.getYieldHistoryHandler).Methods("GET")
	v1.HandleFunc("/portfolio/{address}/yield/claim", s.claimYieldHandler).Methods("POST")

	// 资产相关路由
	v1.HandleFunc("/assets", s.getAssetsHandler).Methods("GET")
	v1.HandleFunc("/assets/{asset_id}", s.getAssetDetailsHandler).Methods("GET")
	v1.HandleFunc("/assets/{asset_id}/performance", s.getAssetPerformanceHandler).Methods("GET")
	v1.HandleFunc("/assets/{asset_id}/distributions", s.getDistributionsHandler).Methods("GET")

	// 健康检查
	s.Router.HandleFunc("/health", s.healthCheckHandler).Methods("GET")
}

// CORS中间件
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusNoContent)
			return
		}

		next.ServeHTTP(w, r)
	})
}

// getPortfolioHandler 获取用户投资组合
func (s *RWAAPIServer) getPortfolioHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]

	if address == "" {
		s.respondWithError(w, http.StatusBadRequest, "用户地址不能为空")
		return
	}

	// 开始数据库事务
	tx, err := s.DB.Begin()
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "数据库错误")
		return
	}
	defer tx.Rollback()

	// 查询用户基本信息
	var portfolio UserPortfolio
	err = tx.QueryRow(`
		SELECT address, total_value, total_yield, unclaimed_yield, last_updated
		FROM users WHERE address = ?
	`, address).Scan(
		&portfolio.UserAddress,
		&portfolio.TotalValue,
		&portfolio.TotalYield,
		&portfolio.UnclaimedYield,
		&portfolio.LastUpdated,
	)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			s.respondWithError(w, http.StatusNotFound, "用户不存在")
		} else {
			s.respondWithError(w, http.StatusInternalServerError, "查询用户信息失败")
		}
		return
	}

	// 查询用户资产持仓
	rows, err := tx.Query(`
		SELECT asset_id, token_symbol, token_name, holdings, holdings_value, apy
		FROM asset_holdings WHERE user_address = ?
	`, address)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "查询资产持仓失败")
		return
	}
	defer rows.Close()

	// 填充资产持仓数据
	for rows.Next() {
		var holding AssetHoldings
		if err := rows.Scan(
			&holding.AssetID,
			&holding.TokenSymbol,
			&holding.TokenName,
			&holding.Holdings,
			&holding.HoldingsValue,
			&holding.APY,
		); err != nil {
			s.respondWithError(w, http.StatusInternalServerError, "处理资产数据失败")
			return
		}
		portfolio.AssetHoldings = append(portfolio.AssetHoldings, holding)
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "数据库提交失败")
		return
	}

	// 返回成功响应
	s.respondWithJSON(w, http.StatusOK, portfolio)
}

// getYieldHistoryHandler 获取用户收益历史
func (s *RWAAPIServer) getYieldHistoryHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]

	if address == "" {
		s.respondWithError(w, http.StatusBadRequest, "用户地址不能为空")
		return
	}

	// 解析查询参数
	limitStr := r.URL.Query().Get("limit")
	limit := 10 // 默认限制10条
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil && parsedLimit > 0 {
			limit = parsedLimit
		}
	}

	// 查询收益历史
	rows, err := s.DB.Query(`
		SELECT timestamp, amount, event_type
		FROM yield_history 
		WHERE user_address = ? 
		ORDER BY timestamp DESC 
		LIMIT ?
	`, address, limit)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "查询收益历史失败")
		return
	}
	defer rows.Close()

	// 填充历史数据
	var history []YieldHistory
	for rows.Next() {
		var record YieldHistory
		if err := rows.Scan(
			&record.Timestamp,
			&record.Amount,
			&record.EventType,
		); err != nil {
			s.respondWithError(w, http.StatusInternalServerError, "处理历史数据失败")
			return
		}
		history = append(history, record)
	}

	// 返回成功响应
	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"address": address,
		"history": history,
		"total":   len(history),
	})
}

// claimYieldHandler 处理用户领取收益
func (s *RWAAPIServer) claimYieldHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	address := vars["address"]

	if address == "" {
		s.respondWithError(w, http.StatusBadRequest, "用户地址不能为空")
		return
	}

	// 开始事务
	tx, err := s.DB.Begin()
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "数据库错误")
		return
	}
	defer tx.Rollback()

	// 查询用户未领取收益
	var unclaimedYield float64
	err = tx.QueryRow(`
		SELECT unclaimed_yield FROM users WHERE address = ?
	`, address).Scan(&unclaimedYield)

	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			s.respondWithError(w, http.StatusNotFound, "用户不存在")
		} else {
			s.respondWithError(w, http.StatusInternalServerError, "查询未领取收益失败")
		}
		return
	}

	if unclaimedYield <= 0 {
		s.respondWithError(w, http.StatusBadRequest, "没有可领取的收益")
		return
	}

	// 更新用户未领取收益为0
	_, err = tx.Exec(`
		UPDATE users SET unclaimed_yield = 0, last_updated = datetime('now')
		WHERE address = ?
	`, address)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "更新收益状态失败")
		return
	}

	// 记录领取事件
	_, err = tx.Exec(`
		INSERT INTO yield_history (user_address, timestamp, amount, event_type)
		VALUES (?, datetime('now'), ?, 'claim')
	`, address, unclaimedYield)
	if err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "记录领取事件失败")
		return
	}

	// 提交事务
	if err := tx.Commit(); err != nil {
		s.respondWithError(w, http.StatusInternalServerError, "数据库提交失败")
		return
	}

	// 模拟调用智能合约处理链上转账（实际应用中应实现）
	// 这里只是返回成功响应
	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"status":         "success",
		"claimed_amount": unclaimedYield,
		"timestamp":      time.Now(),
		"message":        "收益领取成功，将在区块链确认后到账",
	})
}

// getAssetsHandler 获取资产列表
func (s *RWAAPIServer) getAssetsHandler(w http.ResponseWriter, r *http.Request) {
	// 模拟返回资产列表
	assets := []map[string]interface{}{
		{
			"asset_id":    "ASSET-RE-2025-001",
			"name":        "中关村租金收益代币",
			"symbol":      "RWA-RENT",
			"type":        "商业地产",
			"description": "北京市海淀区中关村科技大厦租金收益权代币",
			"current_price": 1.0,
			"apy":         0.07,
			"total_value": 10000000.0,
		},
		{
			"asset_id":    "ASSET-RE-2025-002",
			"name":        "商业区收益代币",
			"symbol":      "RWA-COMM",
			"type":        "商业综合体",
			"description": "上海市浦东新区商业综合体收益权代币",
			"current_price": 1.0,
			"apy":         0.065,
			"total_value": 20000000.0,
		},
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"assets": assets,
		"total":  len(assets),
	})
}

// getAssetDetailsHandler 获取资产详情
func (s *RWAAPIServer) getAssetDetailsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	assetID := vars["asset_id"]

	if assetID == "" {
		s.respondWithError(w, http.StatusBadRequest, "资产ID不能为空")
		return
	}

	// 模拟资产详情数据
	assetDetails := map[string]interface{}{
		"asset_id":       assetID,
		"name":           "中关村租金收益代币",
		"symbol":         "RWA-RENT",
		"contract_address": "0x1234567890123456789012345678901234567890",
		"asset_type":     "商业地产",
		"location":       "北京市海淀区中关村南大街",
		"total_value":    10000000.0,
		"token_supply":   10000000.0,
		"current_price":  1.0,
		"apy":            0.07,
		"vacancy_rate":   0.08,
		"description":    "该资产代表北京市海淀区中关村科技大厦的租金收益权份额，建筑总面积约20,000平方米，主要租户为科技企业。",
		"spv_info": map[string]string{
			"name":     "中关村租金收益专项计划",
			"type":     "有限责任公司",
			"location": "深圳前海",
		},
		"risk_factors": []string{
			"商业地产市场波动风险",
			"租户集中度过高风险",
			"政策监管变化风险",
		},
		"distribution_frequency": "月度",
		"next_distribution_date": time.Now().AddDate(0, 1, 0).Format("2006-01-02"),
	}

	s.respondWithJSON(w, http.StatusOK, assetDetails)
}

// getAssetPerformanceHandler 获取资产表现数据
func (s *RWAAPIServer) getAssetPerformanceHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	assetID := vars["asset_id"]

	if assetID == "" {
		s.respondWithError(w, http.StatusBadRequest, "资产ID不能为空")
		return
	}

	// 模拟资产表现数据
	performance := AssetPerformance{
		AssetID:        assetID,
		CurrentPrice:   1.0,
		PriceChange24h: 0.005,
		Volume24h:      500000.0,
		LastYieldDate:  time.Now().AddDate(0, 0, -15),
		NextYieldDate:  time.Now().AddDate(0, 1, -15),
	}

	s.respondWithJSON(w, http.StatusOK, performance)
}

// getDistributionsHandler 获取分红事件列表
func (s *RWAAPIServer) getDistributionsHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	assetID := vars["asset_id"]

	if assetID == "" {
		s.respondWithError(w, http.StatusBadRequest, "资产ID不能为空")
		return
	}

	// 模拟分红事件数据
	distributions := []DistributionEvent{
		{
			EventID:          "DIST-2025-03",
			AssetID:          assetID,
			DistributionDate: time.Now().AddDate(0, 1, -15),
			AmountPerToken:   0.0058,
			TotalDistribution: 58000.0,
			Status:           "scheduled",
		},
		{
			EventID:          "DIST-2025-02",
			AssetID:          assetID,
			DistributionDate: time.Now().AddDate(0, 0, -15),
			AmountPerToken:   0.0058,
			TotalDistribution: 58000.0,
			Status:           "completed",
		},
		{
			EventID:          "DIST-2025-01",
			AssetID:          assetID,
			DistributionDate: time.Now().AddDate(0, -1, -15),
			AmountPerToken:   0.0058,
			TotalDistribution: 58000.0,
			Status:           "completed",
		},
	}

	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"asset_id":      assetID,
		"distributions": distributions,
		"total":         len(distributions),
	})
}

// healthCheckHandler 健康检查
func (s *RWAAPIServer) healthCheckHandler(w http.ResponseWriter, r *http.Request) {
	s.respondWithJSON(w, http.StatusOK, map[string]interface{}{
		"status":    "healthy",
		"timestamp": time.Now(),
		"service":   "RWA资产管理API服务",
		"version":   "1.0.0",
	})
}

// respondWithJSON 返回JSON响应
func (s *RWAAPIServer) respondWithJSON(w http.ResponseWriter, code int, payload interface{}) {
	response, _ := json.Marshal(payload)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	w.Write(response)
}

// respondWithError 返回错误响应
func (s *RWAAPIServer) respondWithError(w http.ResponseWriter, code int, message string) {
	s.respondWithJSON(w, code, ErrorResponse{
		Error:   http.StatusText(code),
		Code:    code,
		Message: message,
	})
}

// Start 启动API服务器
func (s *RWAAPIServer) Start() error {
	log.Printf("RWA资产管理API服务启动，监听端口: %s\n", s.Port)
	log.Printf("健康检查: http://localhost:%s/health\n", s.Port)
	log.Printf("API文档: http://localhost:%s/api/v1/assets\n", s.Port)

	// 在单独的goroutine中启动服务器
	go func() {
		if err := s.Server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatalf("启动服务器失败: %v\n", err)
		}
	}()

	return nil
}

// Stop 停止API服务器
func (s *RWAAPIServer) Stop(ctx context.Context) error {
	log.Println("正在关闭API服务器...")
	return s.Server.Shutdown(ctx)
}

func main() {
	// 从环境变量获取端口，默认8080
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// 创建API服务器
	server, err := NewRWAAPIServer(port)
	if err != nil {
		log.Fatalf("初始化服务器失败: %v\n", err)
	}

	// 启动服务器
	if err := server.Start(); err != nil {
		log.Fatalf("启动服务器失败: %v\n", err)
	}

	// 等待中断信号以优雅地关闭服务器
	// 在实际应用中，这里应该处理信号量
	log.Println("服务器已启动，按Ctrl+C关闭")
	
	// 阻止主goroutine退出
	select {}
}
```

### 闭环实现与技术整合

| 环节       | 技术栈                  | 产出                       |
|------------|-------------------------|----------------------------|
| 资产评估   | Go + 风险评估模型       | 专业估值报告               |
| SPV        | Go + 法律隔离机制       | 代币发行凭证               |
| 数据上链   | SM3 + 联盟链架构        | 哈希存证凭据               |
| 收益分配   | Solidity (三种机制)     | 自动化分红体系             |
| 流动性     | Uniswap V3              | 可交易流动性池             |
| 用户交互   | Go RESTful API          | 查询与收益领取功能         |

---

综上所述，真实世界资产代币化（RWA）代表的是将实体经济中的现金流和资产价值通过区块链技术实现数字化，而非传统的加密资产投机行为。其实施过程需严格遵循法规框架，建立完善的技术基础设施，并确保全流程合规。成功实施后，RWA能够显著降低投资门槛，使更广泛的投资者群体有机会参与到优质不动产等传统高门槛资产的收益分享中。这一领域的发展将持续推进区块链技术与实体经济的深度融合，其未来演进将通过严谨的技术实现和合规实践逐步构建。

