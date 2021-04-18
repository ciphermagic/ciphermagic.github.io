---
title: Logstash + Elasticsearch + Kibana 搭建日志平台
date: 2015-08-25 17:42
categories: 技术
tags: [logstash,elasticsearch,kibana] 
---

### 概述
日志系统中的收集、查询、显示，分别对应于Logstash、Elasticsearch、Kibana。


- Logstash：是一个应用程序日志、事件的传输、处理、管理和搜索的平台
- Elasticsearch：是基于lucene的开源搜索引擎
- Kibana：是一个功能强大的elasticsearch数据显示客户端




日志收集采用分布式方式，使用redis作为中间缓冲队列。LEK平台结构如下：


---
![](https://files.ciphermagic.cn/elk1.jpeg)


---
- Shipper：Logstash分发端
- Broker：redis缓存数据库
- Indexer：Logstash收集端
- Storage&Search：Elasticsearch
- Web Interface：Kibana


### 安装


搭建环境和所需组件：


 - Windows7
 - redis64-2.8.12
 - logstash-1.4.2
 - elasticsearch-1.2.1
 - kibana3


#### 安装redis


##### 启动redis服务
cmd到`redis64-2.8.12`根目录下，输入：
``` bash
redis-server
```
看到类似信息即可：
``` bash
[5424] 28 Nov 10:06:03.898 * The server is now ready to accept connections on port 6379
```


#### 安装Elasticsearch

##### 启动Elasticsearch服务
cmd到`elasticsearch-1.2.1\bin`根目录下，输入：
``` bash
elasticsearch
```
看到类似信息即可：
``` bash
[2014-11-28 10:06:32,688][INFO ][node] [Batroc the Leaper] started
```


#### 安装Logstash


##### 配置shipper.conf（日志分发）
在`logstash-1.4.2\bin`目录下新建一个shipper.conf文件，内容如下：
``` json
input {
  file {
    path => "D:\error.log"
    type => "App-log"
    codec  => "json"
  }
}


output {
  redis {
    host => "127.0.0.1"
    port => "6379" 
    key => "testlog"
    data_type => "list"
    codec  => "json"
  }
}
```
- input中配置从哪里收集日志，这里表示从file（文件）中收集，地址是`D:\error.log`
- output中配置将日志信息分发到哪里，这里表示分发到redis中，配置好地址和端口等信息
`logstash-1.4.2\bin`目录下，启动shipper的命令：
``` bash
logstash agent -f shipper.conf
```


##### 配置collector.conf（日志收集）
在`logstash-1.4.2\bin`目录下新建一个collector.conf文件，内容如下：
``` json
input {   
  redis
    {
    host => "127.0.0.1"
    port => "6379" 
    key => "testlog"
    data_type => "list"
    type => "redis-input"
    codec  => "json"
    }
}


output {   
  elasticsearch {
    host => "127.0.0.1"
  }
}
```
表示从reids中得到日志信息，并发送给Elasticsearch。
`logstash-1.4.2\bin`目录下，启动collector的命令：
``` bash
logstash agent -f collector.conf
```


#### 安装Kibana
Kibana是一个webapp，把他放在web容器（如tomcat）中即可。


### 运行
请先确保监控的日志文件存在，此处为`D:\error.log`。
 1. 运行redis
 2. 运行Elasticsea
 3. 运行shipper
 4. 运行collector
 5. 启动tomcat容器
 6. 打开Kibanna页面：http://localhost:8080/kibana
 
![](https://files.ciphermagic.cn/elk2.jpeg)
