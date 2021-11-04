---
title: LeetCode 六大股票问题解法
date: 2021-11-04 20:10
categories: 技术
tags: [java]
---

> 推荐阅读：[股票问题系列通解（转载翻译）](https://leetcode-cn.com/circle/article/qiAgHn/)

为了更好的理解和记忆，这里给出我重新整理后的解法，**每个解法都很相似，只需改动少量的条件**

<!-- more -->

##### 121. [买卖股票的最佳时机](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock/)

``` java
    public int maxProfit(int[] prices) {
        int buy = -prices[0]; // 第一天买，减去买的价钱
        int sale = 0; // 第一天卖，不存在这种情况，没有收益
        for (int price : prices) {
            buy = Math.max(buy, -price); // 买，减去买的价钱
            sale = Math.max(sale, buy + price); // 卖，在买的收益基础上加上卖的价钱
        }
        return sale;
    }
```

##### 122. [买卖股票的最佳时机 II](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock-ii/)

``` java
    public int maxProfit(int[] prices) {
        int buy = -prices[0]; // 第一天买，扣掉买的价钱
        int sale = 0; // 第一天卖，不存在这种情况，没有收益
        for (int price : prices) {
            buy = Math.max(buy, sale - price); // 买，在卖的收益基础上减去买的价钱
            sale = Math.max(sale, buy + price); // 卖，在买的收益基础上加上卖的价钱
        }
        return sale;
    }
```

##### 123. [买卖股票的最佳时机 III](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock-iii/)

``` java
    public int maxProfit(int[] prices) {
        int buy1 = -prices[0]; // 第一天买，减去买的价钱
        int sale1 = 0; // 第一天卖，不存在这种情况，没有收益
        int buy2 = -prices[0]; // 第一天买，减去买的价钱
        int sale2 = 0; // 第一天卖，不存在这种情况，没有收益
        for (int price : prices) {
            buy1 = Math.max(buy1, -price); // 第一次买，减去买的价钱
            sale1 = Math.max(sale1, buy1 + price); // 第一次卖，在第一次买的收益基础上加上卖的价钱
            buy2 = Math.max(buy2, sale1 - price); // 第二次买，在第一次卖的收益基础上减去买的价钱
            sale2 = Math.max(sale2, buy2 + price); // 第二次卖，在第二次买的收益基础上加上卖的价钱
        }
        return sale2;
    }
```

##### 188. [买卖股票的最佳时机 IV](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock-iv/)

> 这是六大问题中最难的一个，所对应的解法是最通用的

``` java
    public int maxProfit(int k, int[] prices) {
        int len = prices.length;
        if (len <= 1) {
            return 0;
        }
        k = Math.min(k, len / 2); // 买入卖出成对才能形成收益，k 超过天数的一半就没有意义
        int[] buy = new int[k + 1];
        int[] sale = new int[k + 1];
        Arrays.fill(buy, -prices[0]);
        for (int price : prices) {
            for (int i = 1; i <= k; i++) {
                buy[i] = Math.max(buy[i], sale[i - 1] - price); // 买，在上一次卖的收益基础上减去买的价钱
                sale[i] = Math.max(sale[i], buy[i] + price); // 卖，在买的收益基础上加上卖的价钱
            }
        }
        return sale[k];
    }
```

##### 309. [最佳买卖股票时机含冷冻期](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/)

``` java
    public int maxProfit(int[] prices) {
        int buy = -prices[0]; // 第一天买，减去买的价钱
        int sale = 0; // 第一天卖，不存在这种情况，没有收益
        int prevSale = 0; // 记录前一次卖的收益，初始为0
        for (int price : prices) {
            buy = Math.max(buy, prevSale - price); // 买，在前一次卖的基础上减去买的价钱
            prevSale = sale; // 记录前一次卖的收益
            sale = Math.max(sale, buy + price); // 卖，在买的基础上加上卖的价钱
        }   
        return sale;
    }
```

##### 714. [买卖股票的最佳时机含手续费](https://leetcode-cn.com/problems/best-time-to-buy-and-sell-stock-with-transaction-fee/)

``` java
    public int maxProfit(int[] prices, int fee) {
        int buy = -prices[0]; // 第一天买，减去买的价钱
        int sale = 0; // 第一天卖，不存在这种情况，没有收益
        for (int price : prices) {
            buy = Math.max(buy, sale - price); // 买，在卖的基础上减去买的价钱
            sale = Math.max(sale, buy + price - fee); // 卖，在买的基础上加上卖的价钱，再扣除手续费
        }   
        return sale;
    }
```
