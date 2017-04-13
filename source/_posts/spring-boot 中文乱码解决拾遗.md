---
title: spring-boot 中文乱码解决拾遗
date: 2017-4-10
categories: blog
tags: [spring-boot,java] 
---

在spring-boot项目中返回json格式数据时出现中文乱码问题，有以下两种解决方式：

<!-- more -->

### 注解形式
在`@RequestMapping`注解中指定返回格式，编码：
``` java
    @RequestMapping(value = {"/info"}, produces="application/json;charset=utf-8")
    @ResponseBody
	public String index() {
		return "世界";
	}
```

### 检查版本
在spring-boot`1.2.3.RELEASE`版本中会出现中文乱码问题，使用上述解决方式可以解决。后来无意中把版本改为`1.2.3.RELEASE`，即使不在注解中指定返回格式编码，也不会出现中文乱码。初步认为高版本spring-boot中自动注册了`MappingJackson2HttpMessageConverter`这个bean，因此不用显示的指定，还有待考证。


-END-