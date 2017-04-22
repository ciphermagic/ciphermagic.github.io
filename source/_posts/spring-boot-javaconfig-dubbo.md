---
title: spring-boot 使用JavaConfig方式配置Dubbo
date: 2017-04-14 10:49:00
categories: blog
tags: [spring-boot,java]
---

Spring Boot提倡以JavaConfig的方式进行配置，就是使用注释来描述Bean配置的组件，从而取代让许多开发者诟病已久的xml配置方式。Spring Boot官方也提供了很多相关的JavaConfig例子，例如数据库配置，消息队列配置等。本文将提供一个JavaConfig配置Dubbo的例子。

<!-- more -->

``` java
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.alibaba.dubbo.config.ApplicationConfig;
import com.alibaba.dubbo.config.MonitorConfig;
import com.alibaba.dubbo.config.ProtocolConfig;
import com.alibaba.dubbo.config.ProviderConfig;
import com.alibaba.dubbo.config.RegistryConfig;
import com.alibaba.dubbo.config.spring.AnnotationBean;

@Configuration
public class DubboConfig {

    // 应用名称
	public static final String APPLICATION_NAME = "spring-boot-demo";
	// 扫描service包路径
	public static final String ANNOTATION_PACKAGE = "com.cipher.springboot.service";
    
    // 以下信息将从配置文件application.properties中读取                          
	@Value("${dubbo_registry_address}")
    private String registryAddress;
    @Value("${dubbo_port}")
	private int dubboPort;
	@Value("${dubbo_register}")
	private boolean dubboRegister;
	
	/**
	 * 提供方应用信息，用于计算依赖关系
	 * 
	 * @return
	 */
	@Bean
	public ApplicationConfig applicationConfig() {
		ApplicationConfig applicationConfig = new ApplicationConfig();
		applicationConfig.setName(APPLICATION_NAME);
		return applicationConfig;
	}
	
	/**
	 * 与<dubbo:annotation/>相当.
     * 提供方扫描带有@com.alibaba.dubbo.config.annotation.
	 * Service的注解类
	 * 
	 * @return
	 */
	@Bean
	public static AnnotationBean annotationBean() {
		AnnotationBean annotationBean = new AnnotationBean();
		annotationBean.setPackage(ANNOTATION_PACKAGE);
		return annotationBean;
	}
	
	/**
	 * 使用zookeeper注册中心暴露服务地址
	 * 
	 * @return
	 */
	@Bean
	public RegistryConfig registryConfig() {
		RegistryConfig registryConfig = new RegistryConfig();
		registryConfig.setAddress(registryAddress);
		registryConfig.setRegister(dubboRegister);
		return registryConfig;
	}
	
	/**
	 * 用dubbo协议在指定端口暴露服务
	 * 
	 * @return
	 */
	@Bean
	public ProtocolConfig protocolConfig() {
		ProtocolConfig protocolConfig = new ProtocolConfig("dubbo", dubboPort);
		// 默认为hessian2,但不支持无参构造函数类,而这种方式的效率很低
		protocolConfig.setSerialization("java");
		return protocolConfig;
	}
	
	/**
	 * 监控中心配置，protocol="registry"，表示从注册中心发现监控中心地址
	 * 
	 * @return
	 */
	@Bean
	public MonitorConfig monitorConfig() {
		MonitorConfig monitorConfig = new MonitorConfig();
		monitorConfig.setProtocol("registry");
		return monitorConfig;
	}
	
	/**
	 * 当ProtocolConfig和ServiceConfig某属性没有配置时,采用此缺省值
	 * 
	 * @return
	 */
	@Bean
	public ProviderConfig providerConfig() {
		ProviderConfig providerConfig = new ProviderConfig();
		providerConfig.setTimeout(10000);
		providerConfig.setThreadpool("fixed");
		providerConfig.setThreads(100);
		providerConfig.setAccepts(1000);
		return providerConfig;
	}
}
```