---
title: spring-boot 实现文件上传
date: 2017-4-10
categories: blog
tags: [spring-boot] 
---

### 错误信息: Corrupt form data: premature ending
最近要实现文件上传功能，需要使用O'Reilly公司的cos上传组件，但是这个组件太过久远，最近更新是08年，早期的spring版本支持，现在已经不支持了，好在它是开源的，我根据spring早期版本里的源码自己实现了。但是出现了错误：Corrupt form data: premature ending，网上找到很多都是struts上的错误，原因是request被过滤了，cos只能接受HttpServletRequest，但在spring-boot中也有这个问题，spring-boot虽然节省了我们很多的配置工作，但也无形中为我们做了很多可能我们不需要的配置。
### 声明MultipartResolver
spring默认支持两种上传方式，一个是基于`Servlet3.0`的`StandardServletMultipartResolver`，一个是基于`commons`的`CommonsMultipartResolver`。在spring-boot中，会默认帮我们声明`StandardServletMultipartResolver`，要想更改成`commons`，需要在spring-boot中包含主函数的类中修改成如下代码：
``` java
@Configuration
//exclude表示自动配置时不包括Multipart配置
@EnableAutoConfiguration(exclude={MultipartAutoConfiguration.class})
@ComponentScan("com.essa")
public class UploadApplication extends WebMvcConfigurerAdapter {
	
	public static void main(String[] args) {
		SpringApplication.run(UploadApplication.class, args);
	}
  
    //显式声明CommonsMultipartResolver为mutipartResolver
	@Bean(name="multipartResolver")
	public MultipartResolver mutipartResolver() {
		CommonsMultipartResolver com = new CommonsMultipartResolver();
		com.setDefaultEncoding("utf-8");
		return com;
	}
}
```
### 使用MultipartResolver
若表单的提交方式为`multipart/form-data`，spring会将request根据声明的`mutipartResolver`转换为对应的`MultipartHttpServletRequest`，我们也可以在代码中这样做：
``` java
MultipartHttpServletRequest mRequest = (MultipartHttpServletRequest) request;
```
如此，我们就能使用`mRequest`得到上传文件：
``` java
MultipartFile getFile(String name);         或
List<MultipartFile> getFiles(String name);  或
Map<String, MultipartFile> getFileMap();
```
得到的类型为`MultipartFile`，里面封装了File的各种信息。
### 3. 最后
综上，作为spring的新项目，spring-boot还是很人性化的，只是我现在还没研究透它，它确实为项目开发提供了更加快速简洁的方法。


-END-