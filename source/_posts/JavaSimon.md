---
title: JavaSimon
date: 2015-06-08 09:37
tag: java
categories: 技术
---

JavaSimon，是Java Simple Monitoring的意思，是Java性能监控的一个开源方案（[官方说明](https://code.google.com/p/javasimon/wiki/JavaEE)）。本文介绍它在项目中的用法：

<!-- more -->

### pom.xml，加入core与dashboard的依赖
``` xml
    <dependency>
        <groupId>org.javasimon</groupId>
        <artifactId>javasimon-spring</artifactId>
        <version>3.3.0</version>
    </dependency>
    <dependency>
        <groupId>org.javasimon</groupId>
        <artifactId>javasimon-console-embed</artifactId>
        <version>3.3.0</version>
    </dependency>
```

### web.xml，加入dashboard：
 
``` xml
    <servlet>
        <servlet-name>SimonConsoleServlet</servlet-name>
        <servlet-class>org.javasimon.console.SimonConsoleServlet</servlet-class>
        <init-param>
            <param-name>url-prefix</param-name>
            <param-value>/javasimon</param-value>
        </init-param>
    </servlet>
    <servlet-mapping>
        <servlet-name>SimonConsoleServlet</servlet-name>
        <url-pattern>/javasimon/*</url-pattern>
    </servlet-mapping>
```
 
### applicationContext.xml 加入AOP设置
``` xml
    <!-- 调用StopWatch计时的Interceptor -->
    <bean id="monitoringInterceptor" class="org.javasimon.spring.MonitoringInterceptor" />

    <!-- 监控定义了@Monitored的方法 -->
    <bean id="monitoringAdvisor" class="org.springframework.aop.support.DefaultPointcutAdvisor">
        <property name="advice" ref="monitoringInterceptor" />
        <property name="pointcut">
            <bean class="org.javasimon.spring.MonitoredMeasuringPointcut" />
        </property>
    </bean>
```

### 在已知一定要监控的类或方法上加@Monitored
 
### 不修改代码监控新的方法
如下AOP定义片段监控了cn包或子包下的所有方法
``` xml
 <!-- 性能监控拦截 -->
	<aop:config>
		<aop:advisor advice-ref="monitoringInterceptor" pointcut="execution(* cn..*.*(..))" />
	</aop:config>
```
 
### (可选)监控jdbc访问速度 换用新的jdbc driver，在旧的jdbc url里插入simon
- Oracle
`Driver class name: org.javasimon.jdbc4.Driver instead of oracle.jdbc.OracleDriver`
`URL: jdbc:simon:oracle:thin:@host:1521/database instead of jdbc:oracle:thin:@host:1521/database`
- MySQL
`Driver class name: org.javasimon.jdbc4.Driver instead of com.mysql.jdbc.Driver`
`URL: jdbc:simon:mysql://host:3306/database instead of jdbc:mysql://host:3306/database`

### 使用
 访问"`{your webapp address}/javasimon`"，如:`http://localhost:8080/essa-logger/javasimon`即可。