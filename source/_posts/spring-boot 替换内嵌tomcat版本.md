---
title: spring-boot 替换内嵌tomcat版本
date: 2017-4-10
categories: blog
tags: [spring-boot,tomcat,java] 
---

spring-boot中的内嵌tomcat有默认的指定版本，若想修改为其他版本，有以下两种途径：

<!-- more -->

## 使用parent的方式
若引入spring-boot的方式为加入&lt;parent&gt;：
``` xml
<!-- Inherit defaults from Spring Boot -->
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>1.3.0.BUILD-SNAPSHOT</version>
</parent>
```
则只需在properties中指定tomcat版本即可：
``` xml
<properties>
    <tomcat.version>7.0.59</tomcat.version>
</properties>
```
这种方式比较简单，官方文档中也有[说明](http://docs.spring.io/spring-boot/docs/current-SNAPSHOT/reference/htmlsingle/#_use_tomcat_7_with_maven)

## 使用dependencyManagement的方式
有时我们的项目中有自己的parent，则需要使用&lt;dependencyManagement&gt;的方式引入spring-boot：
``` xml
<properties>
    <tomcat.version>7.0.59</tomcat.version>
</properties>
...
<dependencyManagement>
     <dependencies>
        <dependency>
            <!-- Import dependency management from Spring Boot -->
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-dependencies</artifactId>
            <version>1.3.0.BUILD-SNAPSHOT</version>
            <type>pom</type>
            <scope>import</scope>
        </dependency>
    </dependencies>
</dependencyManagement>
```
此时修改内嵌tomcat的版本则需要在&lt;dependencyManagement&gt;中加入内嵌tomcat的所有依赖，以替换默认的tomcat：
``` xml
<dependencyManagement>
	<dependencies>
		<!-- 替换spring-boot内嵌tomcat -->
		<dependency>
			<groupId>org.apache.tomcat.embed</groupId>
			<artifactId>tomcat-embed-core</artifactId>
			<version>${tomcat.version}</version>
		</dependency>
		<dependency>
			<groupId>org.apache.tomcat.embed</groupId>
			<artifactId>tomcat-embed-el</artifactId>
			<version>${tomcat.version}</version>
		</dependency>
		<dependency>
			<groupId>org.apache.tomcat.embed</groupId>
			<artifactId>tomcat-embed-logging-juli</artifactId>
			<version>${tomcat.version}</version>
		</dependency>
		<dependency>
			<groupId>org.apache.tomcat.embed</groupId>
			<artifactId>tomcat-embed-jasper</artifactId>
			<version>${tomcat.version}</version>
		</dependency>
		<dependency>
			<groupId>org.apache.tomcat.embed</groupId>
			<artifactId>tomcat-embed-websocket</artifactId>
			<version>${tomcat.version}</version>
		</dependency>
		<dependency>
			<groupId>org.apache.tomcat</groupId>
			<artifactId>tomcat-jdbc</artifactId>
			<version>${tomcat.version}</version>
		</dependency>
		<dependency>
			<groupId>org.apache.tomcat</groupId>
			<artifactId>tomcat-jsp-api</artifactId>
			<version>${tomcat.version}</version>
		</dependency>
	</dependencies>
</dependencyManagement>
```
这种方式比较麻烦，但在不能引入parent和需要修改tomcat版本的情况下，也是无赖之举。

> 参考[How to use Tomcat 8 + Spring Boot + Maven](http://stackoverflow.com/questions/24124193/how-to-use-tomcat-8-spring-boot-maven)

-END-