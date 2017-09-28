---
title: ELK 补充：基于 Log4J 发送和收集端配置
date: 2017-09-04 11:54
categories: 技术
tags: [logstash,elasticsearch,kibana]
---

[上篇文章][1]中讲到了基于 logback 的配置。这里补充 Log4J 的配置及其对应的 Logstash 收集端的配置。

### log4j.properties 配置
添加一个`appender`，把日志发送到远端地址：
``` text
# Logstash appender
log4j.appender.logstash=org.apache.log4j.net.SocketAppender  
log4j.appender.logstash.RemoteHost=IP地址
log4j.appender.logstash.port=端口
log4j.appender.logstash.Threshold=INFO
log4j.appender.logstash.ReconnectionDelay=10000
log4j.appender.logstash.LocationInfo=true
```
把这个 `appender` 添加到 `rootLogger` 中：
``` text
log4j.rootLogger=logstash
```

### Logstash 配置
修改 Logstash 收集端的配置文件，输入端使用 log4j 插件：
``` json
input {
 log4j {
        mode => "server"
        host => "上述log4j的IP地址"
        port => 上述log4j的端口
    }
}
output {
    elasticsearch {
        hosts => "ES的IP地址:端口"
        index => "logstash-test"
    }
  stdout {}
}
```

PS：如果使用`Log4J`，就不需要`logback`了，两者取其一即可。

  [1]: http://www.ciphermagic.cn/springmvc-elk.html
