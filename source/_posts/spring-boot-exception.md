---
title: spring-boot 集中处理异常
date: 2016-5-18
categories: blog
tags: [spring-boot,java] 
---

spring-boot配置方式集中处理异常，统一规范接口对外的异常输出。业务代码只需往外抛异常，不需过多关注异常的输出形式。

<!-- more -->

## 非系统抛出异常
对于400，404等非系统抛出的异常，使用以下方式：

``` java
@Configuration
public class ErrorHandler {

	@Bean
	public EmbeddedServletContainerCustomizer containerCustomizer() {
		return new MyCustomizer();
	}

	private static class MyCustomizer implements
			EmbeddedServletContainerCustomizer {
		@Override
		public void customize(ConfigurableEmbeddedServletContainer container) {
			container.addErrorPages(new ErrorPage(HttpStatus.BAD_REQUEST,
					"/400"));
			container.addErrorPages(new ErrorPage(HttpStatus.NOT_FOUND, "/404"));
		}
	}
}
```
对于状态码为400，404的响应会转到相应的请求`/400`，`/404`中处理。

## 系统抛出异常
对于系统抛出的异常，除了跳到错误页面之外，我们常常需要记录错误日志等信息，因此不使用上述方法。而是在处理类和方法上加上注解`@ControllerAdvice`，`@ExceptionHandler`，如下：
``` java
@Controller
@ControllerAdvice
public class ErrorController {
	
	@RequestMapping(value = { "/404" })
	@ResponseBody
	public String notFound() {
		return "404";
	}
	
	@ExceptionHandler(Exception.class)
	@ResponseBody
    public String handleException(Exception e) {
		// 记录错误日志
        return "Exception";
    }
}
```
在此类中一并处理非系统抛出异常，如上述的`/404`请求。

> 参考：
[Spring Boot Reference Guide](http://docs.spring.io/spring-boot/docs/current-SNAPSHOT/reference/htmlsingle/#boot-features-error-handling)，
[Spring Framework Reference Documentation](http://docs.spring.io/spring/docs/4.2.0.BUILD-SNAPSHOT/spring-framework-reference/htmlsingle/#mvc-exceptionhandlers)

-END-
