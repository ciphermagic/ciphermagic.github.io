---
title: SpringMVC 集成 ELK 搭建日志收集服务器
date: 2017-08-29 16:41
categories: 技术
tags: [logstash,elasticsearch,kibana] 
---

### 概述
日志系统中的收集、查询、显示，分别对应于Logstash、Elasticsearch、Kibana。

- Logstash：是一个应用程序日志、事件的传输、处理、管理和搜索的平台
- Elasticsearch：是基于 lucene 的开源搜索引擎
- Kibana：是一个功能强大的 elasticsearch 数据显示客户端

SpingMVC 中的日志收集流程是：
SpringMVC 输出日志 -> Logstash 收集 -> Elasticsearch 持久化 -> Kibana 展示

### 环境

- JDK 8
- Ubuntu 16 （虚拟机）
- Elasticsearch-5.2.2 [下载地址][1]
- Logstash-5.2.2 [下载地址][2]
- Kibana-5.2.2 [下载地址][3]

本文的 ELK 都是安装在虚拟机中，为了解释方便，假设虚拟机 ip 地址为 192.168.1.199，下载好的压缩包全部放在 `/opt `中，并使用 root 用户登录虚拟机。

### 配置 Elasticsearch
进入 `/opt` 目录：
``` shell
# 解压 Elasticsearch
tar -xzvf elasticsearch-5.2.2.tar.gz
# 重命名
mv elasticsearch-5.2.2 elasticsearch
```
修改配置文件，修改主机名称为本机 ip 地址 `network.host: 192.168.1.199`，这样外部才能通过 ip 地址访问：
``` shell
vim elasticsearch/config/elasticsearch.yml
```
Elasticsearch 不能使用 root 用户启动，因此需要添加新的用户：
``` shell
useradd -r -m -s  /bin/bash elk # elk 为用户名称
# 分配权限
chown -R elk /opt
```
启动：
``` shell
su elk
elasticsearch/bin/elasticsearch
```
访问 http://192.168.1.199:9200/ 验证是否正确启动，如果遇到问题可以参考这篇文章：

> http://www.cnblogs.com/sloveling/p/elasticsearch.html

### 配置 Kibana
进入 `/opt` 目录：
``` shell
# 解压 配置 Kibana
tar -xzvf kibana-5.2.2.tar.gz
# 重命名
mv kibana-5.2.2 kibana
```
修改配置文件 `kibana/config/kibana.yml` ，在最后添加：
``` txt
server.port: 8888
server.host: "192.168.1.199"
elasticsearch.url: "http://192.168.1.199:9200"
```
访问 http://192.168.1.199:8888 验证是否正确启动

### 配置 Logstash
进入 `/opt` 目录：
``` shell
# 解压 配置 Logstash
tar -xzvf logstash-5.2.2.tar.gz
# 重命名
mv logstash-5.2.2 logstash
```
新建配置文件：
``` shell
vim logstash/config/logstash-test.conf
```
添加内容：
```
input {
 tcp {
        host => "192.168.1.199"
        port => 8082
        mode => "server"
        ssl_enable => false
        codec => json {
            charset => "UTF-8"
        }
    }
}

output {
    elasticsearch {
        hosts => "192.168.1.199:9200"
        index => "logstash-test"
    }
  stdout { }
}
```
表示从 192.168.1.199:8082 收集日志，并发送到 Elasticsearch （192.168.1.199:9200），索引名称为 logstash-test。
启动 Logstash：
``` shell
# 进入 Logstash 目录
cd logstash
./bin/logstash -f config/logstash-test.conf
```
启动后，Logstash 会持续监听指定的收集端，我们只需要在程序中把日志发送到 192.168.1.199:8082 即可。

### SpringMVC 中配置 logback
添加 maven 依赖：
``` xml
        <!-- logback -->
        <dependency>
            <groupId>net.logstash.logback</groupId>
            <artifactId>logstash-logback-encoder</artifactId>
            <version>4.11</version>
        </dependency>
        <dependency>
            <groupId>ch.qos.logback</groupId>
            <artifactId>logback-classic</artifactId>
            <version>1.2.3</version>
        </dependency>
        <dependency>
            <groupId>net.logstash.log4j</groupId>
            <artifactId>jsonevent-layout</artifactId>
            <version>1.7</version>
        </dependency>
```
在 resource 文件夹中添加配置文件 logback.xml：
``` xml 
<?xml version="1.0" encoding="UTF-8"?>
<configuration debug="false">

    <!--定义日志文件的存储地址 勿在 LogBack 的配置中使用相对路径-->
    <property name="LOG_HOME" value="E:/logs"/>

    <!-- 控制台输出 -->
    <appender name="STDOUT" class="ch.qos.logback.core.ConsoleAppender">
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
        </encoder>
    </appender>

    <!-- 按照每天生成日志文件 -->
    <appender name="FILE" class="ch.qos.logback.core.rolling.RollingFileAppender">
        <rollingPolicy class="ch.qos.logback.core.rolling.TimeBasedRollingPolicy">
            <!--日志文件输出的文件名-->
            <FileNamePattern>${LOG_HOME}/TestWeb.log_%d{yyyy-MM-dd}.log</FileNamePattern>
            <!--日志文件保留天数-->
            <MaxHistory>30</MaxHistory>
        </rollingPolicy>
        <encoder class="ch.qos.logback.classic.encoder.PatternLayoutEncoder">
            <!--格式化输出：%d表示日期，%thread表示线程名，%-5level：级别从左显示5个字符宽度%msg：日志消息，%n是换行符-->
            <pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{50} - %msg%n</pattern>
        </encoder>
        <!--日志文件最大的大小-->
        <triggeringPolicy class="ch.qos.logback.core.rolling.SizeBasedTriggeringPolicy">
            <MaxFileSize>10MB</MaxFileSize>
        </triggeringPolicy>
    </appender>

    <!-- 发送日志到 logstash -->
    <appender name="stash" class="net.logstash.logback.appender.LogstashTcpSocketAppender">
        <destination>192.168.1.199:8082</destination>
        <!-- encoder is required -->
        <encoder charset="UTF-8" class="net.logstash.logback.encoder.LogstashEncoder"/>
    </appender>

    <!-- 日志输出级别 -->
    <root level="INFO">
        <!-- 只有添加stash关联才会被收集-->
        <appender-ref ref="stash"/>
        <appender-ref ref="STDOUT"/>
        <appender-ref ref="FILE"/>
    </root>

</configuration>
```
关键是 stash，只有添加了这个 appender，才能把日志发送给 Logstash。

#### 代码中输出日志
代码中使用 `slf4j` 获取日志对象，就可以打印日志：
``` java
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

private static Logger log = LoggerFactory.getLogger(Test.class);
```

### 最后
以上就是 SpringMVC 集成 ELK 的全部操作，输出日志后，刷新 Kibana 页面，就会看到日志信息。

### 参考

> [Logback+ELK+SpringMVC搭建日志收集服务器][4]

> [Logstash + Elasticsearch + Kibana 搭建日志平台][5]


  [1]: https://artifacts.elastic.co/downloads/elasticsearch/elasticsearch-5.2.2.tar.gz
  [2]: https://artifacts.elastic.co/downloads/logstash/logstash-5.2.2.tar.gz
  [3]: https://artifacts.elastic.co/downloads/kibana/kibana-5.2.2-linux-x86_64.tar.gz
  [4]: https://mp.weixin.qq.com/s?__biz=MzAxODcyNjEzNQ==&mid=2247484140&idx=2&sn=c48a3144aa11d7acb7ebbe2539902b2e&chksm=9bd0af74aca72662638579bebe27a17bc211819c4023d250b015dca5cdeeea08b4efc83b5a57&mpshare=1&scene=1&srcid=08294kC84XBsaUHTrmvjEpCb#rd
  [5]: http://www.ciphermagic.cn/logstash-elasticsearch-kibana.html
