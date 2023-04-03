---
title: Go 基于泛化调用与 Nacos 实现 Dubbo 代理
date: 2023-04-03 11:47
categories: 技术
tags: [go,dubbo] 
---
## 前言

由于工作中使用的 rpc 框架是 dubbo，经常需要调试不同环境的 dubbo 接口，例如本地环境、开发环境和测试环境。而为了同一管理 http 接口和 dubbo 接口，希望使用统一的调试工具，例如 PostMan 或 ApiPost 等，因此萌生了开发一个 dubbo 的 http 代理工具的念头。

## 准备

由于是通用的 dubbo 代理，因此肯定需要使用**泛化**调用。而我们使用的注册中心是 **nacos**，因此也需要使用 nacos-sdk 来获取 provider 的实例信息。

## 实现

### 项目结构
```                     
│
├── dubbo/                 
│    ├─ generic.go   # 泛化调用 dubbo 接口
│    ├─ models.go    # 数据模型
│    └─ nacos.go     # 获取 nacos 元信息
├── web/                       
│    └─ server.go    # 对外 http 接口
│
├── main.go          # main 入口函数
└── go.mod           # 模块描述文件
```

### go.mod

``` go
module dubbo-proxy

go 1.20

require (
	dubbo.apache.org/dubbo-go/v3 v3.0.5
	github.com/apache/dubbo-go-hessian2 v1.12.0
	github.com/gin-gonic/gin v1.9.0
	github.com/nacos-group/nacos-sdk-go/v2 v2.1.2
)
```

### 返回数据格式
`dubbo/models.go`:

```go
type DataResult struct {
	Env     string `json:"env,omitempty"`  // 当前调用环境
	Code    string `json:"code,omitempty"` // 返回结果码
	Data    any    `json:"data,omitempty"` // 返回结果
	Message string `json:"message,omitempty"` // 返回消息
}
```

### 获取 nacos 元信息

#### 根据环境创建 nacos client
```go
func buildClient(env string, serverCfgs []constant.ServerConfig) naming_client.INamingClient {
	client, _ := clients.NewNamingClient(
		vo.NacosClientParam{
			ClientConfig: constant.NewClientConfig(
				constant.WithNamespaceId(env),
				constant.WithNotLoadCacheAtStart(true),
			),
			ServerConfigs: serverCfgs,
		},
	)
	return client
}
```

#### 获取服务实例
```go
func SelectInstance(env, servName string) (string, bool) {
	cli, ok := cliMap[env]
	if !ok {
		return "client not found from " + env, false
	}
	instances, e := cli.SelectInstances(vo.SelectInstancesParam{
		ServiceName: fmt.Sprintf("providers:%s:1.0.0:", servName),
		HealthyOnly: true,
	})
	if e != nil {
		return "instance not found, " + e.Error(), false
	}
	if len(instances) <= 0 {
		return "instance not found", false
	}
	return fmt.Sprintf("dubbo://%s:%d", instances[0].Ip, instances[0].Port), true
}
```

#### 完整代码
`dubbo/nacos.go`:
```go
package dubbo

import (
	"fmt"
	"github.com/nacos-group/nacos-sdk-go/v2/clients"
	"github.com/nacos-group/nacos-sdk-go/v2/clients/naming_client"
	"github.com/nacos-group/nacos-sdk-go/v2/common/constant"
	"github.com/nacos-group/nacos-sdk-go/v2/vo"
)

var cliMap = make(map[string]naming_client.INamingClient)

func init() {
	serverCfgs := []constant.ServerConfig{
		*constant.NewServerConfig("127.0.0.1", 6801, constant.WithContextPath("/nacos")),
	}
	cliMap["local"] = buildClient("local", serverCfgs)
	cliMap["dev"] = buildClient("develop", serverCfgs)
	cliMap["test"] = buildClient("test", serverCfgs)
}

func buildClient(env string, serverCfgs []constant.ServerConfig) naming_client.INamingClient {
	client, _ := clients.NewNamingClient(
		vo.NacosClientParam{
			ClientConfig: constant.NewClientConfig(
				constant.WithNamespaceId(env),
				constant.WithNotLoadCacheAtStart(true),
			),
			ServerConfigs: serverCfgs,
		},
	)
	return client
}

func SelectInstance(env, servName string) (string, bool) {
	cli, ok := cliMap[env]
	if !ok {
		return "client not found from " + env, false
	}
	instances, e := cli.SelectInstances(vo.SelectInstancesParam{
		ServiceName: fmt.Sprintf("providers:%s:1.0.0:", servName),
		HealthyOnly: true,
	})
	if e != nil {
		return "instance not found, " + e.Error(), false
	}
	if len(instances) <= 0 {
		return "instance not found", false
	}
	return fmt.Sprintf("dubbo://%s:%d", instances[0].Ip, instances[0].Port), true
}
```

### 泛化调用

#### dubbo root 配置

``` go
var dubboRoot = cfg.NewRootConfigBuilder().SetProtocols(map[string]*cfg.ProtocolConfig{
	dubbo.DUBBO: {
		Params: map[string]interface{}{
			"getty-session-param": map[string]interface{}{
				"max-msg-len": 1024000,
			},
		},
	},
}).Build()
```

#### 泛化调用

``` go
func GenericInvoke(iName, method, env string, req []byte) DataResult {
	instance, ok := SelectInstance(env, iName)
	if !ok {
		return DataResult{
			Code:    "ERROR",
			Message: instance,
		}
	}
	cfg.Load(cfg.WithRootConfig(dubboRoot))
	refConf := cfg.ReferenceConfig{
		InterfaceName: iName,
		Cluster:       "failover",
		Protocol:      dubbo.DUBBO,
		Generic:       "true",
		Version:       "1.0.0",
		URL:           instance,
	}
	refConf.Init(dubboRoot)
	refConf.GenericLoad("dubbo-proxy")
	var args = utils.Unmarshal(req, &map[string]hessian.Object{})
	raw, err := refConf.GetRPCService().(*generic.GenericService).Invoke(context.Background(), method, nil, []hessian.Object{args})
	if err != nil {
		panic(err)
	}
	rawResult := raw.(map[interface{}]interface{})
	result := DataResult{
		Code:    rawResult["code"].(string),
		Message: rawResult["message"].(string),
		Data:    utils.ConvertAs(rawResult["data"], map[string]interface{}{}),
	}
	return result
}
```

注意`25-30`行要根据业务自身的返回数据格式包装结果：
``` go
/*
	这个例子的 dubbo 调用都会返回通过的结构：
	{
		"code": "",
		"message": "",
		"data": // 真正的调用结果
	}
*/
rawResult := raw.(map[interface{}]interface{})
result := DataResult{
	Code:    rawResult["code"].(string),
	Message: rawResult["message"].(string),
	Data:    rawResult["data"],
}
```

#### 完整代码
`dubbo/generic.go`:
```go
package dubbo

import (
	"context"
	"dubbo-proxy/utils"
	cfg "dubbo.apache.org/dubbo-go/v3/config"
	"dubbo.apache.org/dubbo-go/v3/config/generic"
	_ "dubbo.apache.org/dubbo-go/v3/imports"
	"dubbo.apache.org/dubbo-go/v3/protocol/dubbo"
	hessian "github.com/apache/dubbo-go-hessian2"
)

var dubboRoot = cfg.NewRootConfigBuilder().SetProtocols(map[string]*cfg.ProtocolConfig{
	dubbo.DUBBO: {
		Params: map[string]interface{}{
			"getty-session-param": map[string]interface{}{
				"max-msg-len": 1024000,
			},
		},
	},
}).Build()

func GenericInvoke(iName, method, env string, req []byte) DataResult {
	instance, ok := SelectInstance(env, iName)
	if !ok {
		return DataResult{
			Code:    "ERROR",
			Message: instance,
		}
	}
	cfg.Load(cfg.WithRootConfig(dubboRoot))
	refConf := cfg.ReferenceConfig{
		InterfaceName: iName,
		Cluster:       "failover",
		Protocol:      dubbo.DUBBO,
		Generic:       "true",
		Version:       "1.0.0",
		URL:           instance,
	}
	refConf.Init(dubboRoot)
	refConf.GenericLoad("dubbo-proxy")
	var args = utils.Unmarshal(req, &map[string]hessian.Object{})
	raw, err := refConf.GetRPCService().(*generic.GenericService).Invoke(context.Background(), method, nil, []hessian.Object{args})
	if err != nil {
		panic(err)
	}
	rawResult := raw.(map[interface{}]interface{})
	result := DataResult{
		Code:    rawResult["code"].(string),
		Message: rawResult["message"].(string),
		Data:    utils.ConvertAs(rawResult["data"], map[string]interface{}{}),
	}
	return result
}
```

### 提供 http 服务

`dubbo/generic.go`:

``` go
package web

import (
	"dubbo-proxy/dubbo"
	"github.com/gin-gonic/gin"
	"net/http"
)

func Run() {
	router := gin.Default()
	router.POST("/:intf/:method", func(c *gin.Context) {
		intf := c.Param("intf")
		method := c.Param("method")
		env := c.Query("env")
		data, err := c.GetRawData()
		if err != nil {
		    panic(err)
		}
		res := dubbo.GenericInvoke(intf, method, env, data)
		res.Env = env
		c.JSON(http.StatusOK, res)
	})
	panic(router.Run(":7788"))
}
```

### 启动

`main.go`:

``` go
package main

import "dubbo-proxy/web"

func main() {
	web.Run()
}
```

## 效果

![效果](https://files.ciphermagic.cn/Snipaste_2023-04-03_11-37-41.png)
