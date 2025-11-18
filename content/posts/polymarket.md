---
title: 聊聊我的 Polymarket 套利机器人：用 Go 找预测市场的赚钱机会！
date: 2025-10-24T21:16:00+08:00
categories: ["技术", "web3"]
tags: ["go", "web3", "arbitrage"] 
---

最近我在搞一个好玩的项目，用 Go 写了个程序来监控 Polymarket 上的套利机会。Polymarket 是个基于区块链的预测市场，里面有各种事件的结果可以交易，比如“某件事会不会发生”之类的。这篇文章我就来聊聊这个程序（`polymarket_arbitrage.go`）的代码和设计，带你看看它是怎么帮我发现潜在赚钱机会的！

## 核心代码片段
以下是程序的核心功能代码，主要负责抓取 Polymarket 的市场数据，找出总概率成本低于 100% 的市场（也就是有套利空间的），然后给出投资建议。

1. 定义数据结构
```go
type Market struct {
    ID string `json:"id"`
    Question string `json:"question"`
    Type string `json:"type"`
    Volume string `json:"volume"` // 字符串形式
    Outcomes string `json:"outcomes"` // JSON 字符串，如 "[\"Yes\", \"No\"]"
    OutcomePrices string `json:"outcomePrices"` // JSON 字符串，如 "[\"0.0345\", \"0.9655\"]"
}

type ArbitrageOpportunity struct {
    MarketID string
    Question string
    TotalCost float64
    ArbitragePercent float64
    SuggestedInvestment float64
    SharesToBuy map[string]float64
}
```

2. 计算套利机会
```go
func calculateArbitrage(market Market) *ArbitrageOpportunity {
    var outcomes []string
    if err := json.Unmarshal([]byte(market.Outcomes), &outcomes); err != nil {
        fmt.Printf("解析 outcomes 失败（市场: %s）: %v\n", market.Question, err)
        return nil
    }

    var priceStrs []string
    if err := json.Unmarshal([]byte(market.OutcomePrices), &priceStrs); err != nil {
        fmt.Printf("解析 outcomePrices 失败（市场: %s）: %v\n", market.Question, err)
        return nil
    }

    prices := make([]float64, len(priceStrs))
    for i, priceStr := range priceStrs {
        price, err := strconv.ParseFloat(priceStr, 64)
        if err != nil {
            fmt.Printf("转换价格失败（市场: %s, 结果: %s）: %v\n", market.Question, outcomes[i], err)
            return nil
        }
        prices[i] = price
    }

    volume, err := strconv.ParseFloat(market.Volume, 64)
    if err != nil || len(outcomes) < 2 || market.Type == "BINARY" || volume < 10000 {
        return nil // 过滤二元市场、低量市场或解析失败
    }

    totalCost := 0.0
    for _, price := range prices {
        totalCost += price
    }
    if totalCost >= 1.0 {
        return nil // 无套利机会
    }

    arbitragePct := (1.0 - totalCost) * 100
    if arbitragePct < 2.0 { // 至少 2% 利润
        return nil
    }

    investment := 1000.0
    sharesToBuy := make(map[string]float64)
    for i, outcome := range outcomes {
        if prices[i] > 0 {
            sharesToBuy[outcome] = investment / float64(len(outcomes)) / prices[i]
        }
    }

    return &ArbitrageOpportunity{
        MarketID: market.ID,
        Question: market.Question,
        TotalCost: totalCost,
        ArbitragePercent: arbitragePct,
        SuggestedInvestment: investment,
        SharesToBuy: sharesToBuy,
    }
}
```

3. 抓取市场数据
```go
func fetchMarkets() ([]Market, error) {
    var allMarkets []Market
    offset := 0
    limit := 100

    client, err := proxyClient()
    if err != nil {
        return nil, fmt.Errorf("创建代理失败: %v", err)
    }

    for {
        endDateMin := time.Now().AddDate(0, 0, 7).Format("2006-01-02")
        endDateMax := time.Now().AddDate(0, 0, 49).Format("2006-01-02")
        fetchUrl := fmt.Sprintf("%s/markets?active=true&order=volume&ascending=false&end_date_min=%s&end_date_max=%s&limit=%d&offset=%d",
            gammaAPI, endDateMin, endDateMax, limit, offset)
        resp, err := httpProxy(client, fetchUrl)
        if err != nil {
            return nil, fmt.Errorf("API 请求失败 (offset=%d): %v", offset, err)
        }
        defer resp.Body.Close()

        var markets []Market
        if err := json.NewDecoder(resp.Body).Decode(&markets); err != nil {
            return nil, fmt.Errorf("JSON 解析失败 (offset=%d): %v", offset, err)
        }

        allMarkets = append(allMarkets, markets...)
        fmt.Printf("发现 %d 个活跃市场\n", len(markets))

        offset += limit
        if len(markets) < limit {
            break
        }
    }

    return allMarkets, nil
}
```

## 这个程序干啥的？
简单来说，这程序是用来从 Polymarket 的 API（`https://gamma-api.polymarket.com/markets`）抓取市场数据，找出有套利机会的市场。啥叫套利？就是在预测市场里，如果某个事件的所有结果概率加起来不到 100%，你就可以“低买高卖”，稳赚差价！比如，一个市场有三个结果，价格分别是 $0.30、$0.40、$0.25，加起来才 $0.95，投 1000 块就能赚 5% 的利润。
程序会：
1. 抓取活跃市场（7-49 天内结束，按交易量排序）。
2. 分析每个市场，找出总成本 < 0.98（利润 ≥ 2%）的多结果市场（排除 Yes/No 的二元市场）。
3. 给出投资建议，比如投 1000 USDC，买多少股每种结果。

## 一些注意的点
### 1. 分页抓取，啥都不漏
Polymarket 的 API 一次最多返回 100 个市场（`limit=100`），但实际市场可能有好几百。程序用了个循环，通过 `offset`（0、100、200...）把所有市场都抓下来，直到返回的数据少于 100 条为止。代码里这个逻辑在 `fetchMarkets` 函数：
```go
for {
    fetchUrl := fmt.Sprintf("%s/markets?...&limit=%d&offset=%d", gammaAPI, limit, offset)
    // 抓数据，存到 allMarkets
    allMarkets = append(allMarkets, markets...)
    if len(markets) < limit {
        break
    }
    offset += limit
}
```
每次抓完一页，还会打印“已分析 X 个市场，继续获取 offset=Y...”，让我知道进度，挺贴心的。
### 2. 代理支持，网络无忧
我用的是 ClashX 代理（`127.0.0.1:7890`），因为国内网络访问 Polymarket API 可能会被墙。程序把代理配置单独抽到 `proxyClient` 和 `httpProxy` 函数里，清晰又好改：
```go
func proxyClient() (*http.Client, error) {
    proxyURL, err := url.Parse("http://127.0.0.1:7890")
    client := &http.Client{
        Transport: &http.Transport{
            Proxy: http.ProxyURL(proxyURL),
        },
        Timeout: 10 * time.Second,
    }
    return client, nil
}
```
想换别的代理？改个 `proxyURL` 就行，方便得很！
### 3. JSON 解析，适配 API 怪癖
Polymarket API 的 `outcomes` 和 `outcomePrices` 字段是 JSON 字符串（像 `"[\"Yes\", \"No\"]"`），而不是直接的数组。这让我一开始解析的时候踩了个坑。程序用 `json.Unmarshal` 专门处理这个怪癖，稳稳地把字符串转成数组：
```go
var outcomes []string
if err := json.Unmarshal([]byte(market.Outcomes), &outcomes); err != nil {
    fmt.Printf("解析 outcomes 失败（市场: %s）: %v\n", market.Question, err)
    return nil
}
```
价格也是先转成 `[]string`，再用 `strconv.ParseFloat` 变 `float64`，保证计算精准。
### 4. 错误处理，稳如老狗
程序在每个关键步骤都加了错误检查，比如代理配置、API 请求、JSON 解析。如果出问题，会打印详细错误，比如“API 请求失败 (offset=100): ...”或“解析 outcomes 失败（市场: XXX）”。这让我调试的时候特别省心：
```go
if err := json.NewDecoder(resp.Body).Decode(&markets); err != nil {
    return nil, fmt.Errorf("JSON 解析失败 (offset=%d): %v", offset, err)
}
```
### 5. 输出清晰，交易直接抄
找到套利机会后，程序会打印超级清楚的建议，比如：
```
发现 1 个套利机会！
机会 1:
  市场: Who will win the 2025 Oscar for Best Picture?
  市场 ID: 123456
  总成本: $0.9500 USDC (预期利润: 5.00%)
  建议投资: $1000 USDC
  买入建议:
    - Film A: 1111.11 股 (价格: $0.3000)
    - Film B: 833.33 股 (价格: $0.4000)
    - Film C: 1333.33 股 (价格: $0.2500)
```
直接照着这个去 Polymarket 下单就行，省得我自己算！
## 不足和改进点
当然，这程序也不是完美无缺：
- **速度慢**：分页是串行请求，如果市场有 1000 个，得抓 10 次，挺慢的。可以加 goroutines 并行抓，但得小心 API 限速。
- **没通知**：找到套利机会只能打印到终端，我想加个 Telegram 推送，实时通知我。
- **过滤太严**：只看多结果市场（`type != "BINARY"`）和利润 ≥ 2%，可能错过一些小机会。可以让用户自定义过滤条件。
## 咋跑这个程序？
1. **装 Go**：确保 Go 1.16+ 装好了（`go version`）。
2. **配代理**：ClashX 跑在 `127.0.0.1:7890`（或改成你自己的代理）。
3. **跑代码**：
   ```bash
   go run polymarket_arbitrage.go
   ```
4. **看结果**：程序会抓数据、分析套利，打印机会。如果没机会，就说“暂无套利机会”。

## 完整代码
以下是完整的 Go 代码，核心功能是抓取 Polymarket 的市场数据，找出总概率成本低于 100% 的市场（也就是有套利空间的），然后给出投资建议。
```go
package main
import (
    "encoding/json"
    "fmt"
    "net/http"
    "net/url"
    "strconv"
    "time"
)
// Gamma API 基础 URL
const gammaAPI = "https://gamma-api.polymarket.com"
// Market 结构体：解析 API 返回的市场数据
type Market struct {
    ID string `json:"id"`
    Question string `json:"question"`
    Type string `json:"type"`
    Volume string `json:"volume"` // 字符串形式
    Outcomes string `json:"outcomes"` // JSON 字符串，如 "[\"Yes\", \"No\"]"
    OutcomePrices string `json:"outcomePrices"` // JSON 字符串，如 "[\"0.0345\", \"0.9655\"]"
}
// ArbitrageOpportunity 结构体：套利机会
type ArbitrageOpportunity struct {
    MarketID string
    Question string
    TotalCost float64
    ArbitragePercent float64
    SuggestedInvestment float64
    SharesToBuy map[string]float64
}
func proxyClient() (*http.Client, error) {
    // 配置 ClashX HTTP 代理
    proxyURL, err := url.Parse("http://127.0.0.1:7890")
    if err != nil {
       return nil, fmt.Errorf("解析代理 URL 失败: %v", err)
    }
    client := &http.Client{
       Transport: &http.Transport{
          Proxy: http.ProxyURL(proxyURL),
       },
       Timeout: 10 * time.Second,
    }
    return client, nil
}
func httpProxy(client *http.Client, fetchUrl string) (*http.Response, error) {
    req, err := http.NewRequest("GET", fetchUrl, nil)
    if err != nil {
       return nil, fmt.Errorf("创建请求失败: %v", err)
    }
    resp, err := client.Do(req)
    if err != nil {
       return nil, fmt.Errorf("API 请求失败: %v", err)
    }
    if resp.StatusCode != http.StatusOK {
       return nil, fmt.Errorf("API 返回错误: %d", resp.StatusCode)
    }
    return resp, nil
}
// fetchMarkets 获取所有活跃市场数据
func fetchMarkets() ([]Market, error) {
    var allMarkets []Market
    offset := 0
    limit := 100
    // 配置 ClashX HTTP 代理
    client, err := proxyClient()
    if err != nil {
       return nil, fmt.Errorf("创建代理失败: %v", err)
    }
    for {
       endDateMin := time.Now().AddDate(0, 0, 7).Format("2006-01-02")
       endDateMax := time.Now().AddDate(0, 0, 49).Format("2006-01-02")
       fetchUrl := fmt.Sprintf("%s/markets?active=true&order=volume&ascending=false&end_date_min=%s&end_date_max=%s&limit=%d&offset=%d",
          gammaAPI, endDateMin, endDateMax, limit, offset)
       resp, err := httpProxy(client, fetchUrl)
       if err != nil {
          return nil, fmt.Errorf("API 请求失败 (offset=%d): %v", offset, err)
       }
       defer resp.Body.Close()
       var markets []Market
       if err := json.NewDecoder(resp.Body).Decode(&markets); err != nil {
          return nil, fmt.Errorf("JSON 解析失败 (offset=%d): %v", offset, err)
       }
       // 累积市场数据
       allMarkets = append(allMarkets, markets...)
       fmt.Printf("发现 %d 个活跃市场\n", len(markets))
       var opportunities []ArbitrageOpportunity
       for _, market := range markets {
          if opp := calculateArbitrage(market); opp != nil {
             opportunities = append(opportunities, *opp)
          }
       }
       if len(opportunities) == 0 {
          fmt.Println("暂无套利机会（总概率成本 >= 98%）。")
       } else {
          fmt.Printf("发现 %d 个套利机会！\n\n", len(opportunities))
          for i, opp := range opportunities {
             fmt.Printf("机会 %d:\n", i+1)
             fmt.Printf(" 市场: %s\n", opp.Question)
             fmt.Printf(" 市场 ID: %s\n", opp.MarketID)
             fmt.Printf(" 总成本: $%.4f USDC (预期利润: %.2f%%)\n", opp.TotalCost, opp.ArbitragePercent)
             fmt.Printf(" 建议投资: $%.0f USDC\n", opp.SuggestedInvestment)
             fmt.Println(" 买入建议:")
             for outcome, shares := range opp.SharesToBuy {
                fmt.Printf(" - %s: %.2f 股 (价格: $%.4f)\n", outcome, shares, opp.SuggestedInvestment/float64(len(opp.SharesToBuy))/shares)
             }
             fmt.Print("\n" + "==================================================" + "\n")
          }
       }
       // 递增 offset，获取下一页
       offset += limit
       fmt.Printf("已分析 %d 个市场，继续获取 offset=%d...\n\n", len(allMarkets), offset)
       // 如果返回的市场数量 < limit，说明已到最后一页
       if len(markets) < limit {
          break
       }
    }
    return allMarkets, nil
}
// calculateArbitrage 计算单个市场的套利机会
func calculateArbitrage(market Market) *ArbitrageOpportunity {
    // 解析 outcomes JSON 字符串
    var outcomes []string
    if err := json.Unmarshal([]byte(market.Outcomes), &outcomes); err != nil {
       fmt.Printf("解析 outcomes 失败（市场: %s）: %v\n", market.Question, err)
       return nil
    }
    // 解析 outcomePrices JSON 字符串
    var priceStrs []string
    if err := json.Unmarshal([]byte(market.OutcomePrices), &priceStrs); err != nil {
       fmt.Printf("解析 outcomePrices 失败（市场: %s）: %v\n", market.Question, err)
       return nil
    }
    // 转换价格为 float64
    prices := make([]float64, len(priceStrs))
    for i, priceStr := range priceStrs {
       price, err := strconv.ParseFloat(priceStr, 64)
       if err != nil {
          fmt.Printf("转换价格失败（市场: %s, 结果: %s）: %v\n", market.Question, outcomes[i], err)
          return nil
       }
       prices[i] = price
    }
    // 过滤无效市场
    volume, err := strconv.ParseFloat(market.Volume, 64)
    if err != nil || len(outcomes) < 2 || market.Type == "BINARY" || volume < 10000 {
       return nil // 过滤二元市场、低量市场或解析失败
    }
    // 计算总成本
    totalCost := 0.0
    for _, price := range prices {
       totalCost += price
    }
    if totalCost >= 1.0 {
       return nil // 无套利机会
    }
    // 计算套利百分比
    arbitragePct := (1.0 - totalCost) * 100
    if arbitragePct < 2.0 { // 至少 2% 利润
       return nil
    }
    // 计算建议买入股份（投资 1000 USDC）
    investment := 1000.0
    sharesToBuy := make(map[string]float64)
    for i, outcome := range outcomes {
       if prices[i] > 0 {
          sharesToBuy[outcome] = investment / float64(len(outcomes)) / prices[i]
       }
    }
    return &ArbitrageOpportunity{
       MarketID: market.ID,
       Question: market.Question,
       TotalCost: totalCost,
       ArbitragePercent: arbitragePct,
       SuggestedInvestment: investment,
       SharesToBuy: sharesToBuy,
    }
}
func main() {
    fmt.Println("=== Polymarket 套利监控程序 ===")
    fmt.Printf("当前时间: %s\n", time.Now().Format("2006-01-02 15:04:05"))
    fmt.Print("监控活跃市场（结束日期: 7-49 天内，volume 高优先）..." + "\n")
    fmt.Println()
    markets, err := fetchMarkets()
    if err != nil {
       fmt.Printf("错误: %v\n", err)
       fmt.Println("检查网络或 API 状态。")
       return
    }
    fmt.Printf("共分析 %d 个活跃市场\n", len(markets))
}
```

## 总结
这程序是我用 Go 写的一个小玩具，专门挖 Polymarket 的套利机会。分页抓数据、代理支持、精准解析、错误处理、清晰输出，功能齐全又好用。接下来我想加点并行请求和 Telegram 通知，让它更牛！如果你也对预测市场感兴趣，试试跑跑看，说不定能发现个赚钱的机会呢！

 
 
