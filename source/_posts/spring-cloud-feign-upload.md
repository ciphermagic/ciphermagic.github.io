---
title: Spring Cloud Feign 文件传输
date: 2018-04-27 21:41
categories: 技术
tags: [spring-cloud] 
---

微服务中通常使用 Feign 作为服务消费者，那么如何使用 Feign 接口传输文件呢？

<!-- more -->

### 一、配置文件解析器

服务提供者和消费者都需要配置文件解析器，这里使用`commons-fileupload`替换原有的解析器：

依赖：
``` xml
<dependency>
    <groupId>commons-fileupload</groupId>
    <artifactId>commons-fileupload</artifactId>
    <version>1.3.1</version>
</dependency>
```

注入`bean`：
``` java
@Bean(name = "multipartResolver")
public MultipartResolver mutipartResolver() {
    CommonsMultipartResolver com = new CommonsMultipartResolver();
    com.setDefaultEncoding("utf-8");
    return com;
}
```

程序入口中剔除原有的解析器：
``` java
@SpringBootApplication(exclude = {MultipartAutoConfiguration.class})
```

### 二、服务提供者，即接收文件一方的配置

`Controller`的写法：
``` java
@ResponseBody
@RequestMapping(value = "/upload", method = {RequestMethod.POST},
                produces = {MediaType.APPLICATION_JSON_UTF8_VALUE},
                consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public Result<String> uploadFile(@RequestPart("file") MultipartFile file,
                                  @RequestParam("id") Long id) {
    String fileName = file.getOriginalFilename();
    String extend = FileOperateUtil.suffix(fileName);
    FileOperateUtil.copy("E:\\" + fileName, file);
    return ResultBuilder.success("ok");
}
```
`@RequestPart`指定文件，后面的`@RequestParam`是额外参数，注意额外参数不能超过url长度限制。

### 三、服务消费者配置

依赖：
``` xml
<dependency>
    <groupId>io.github.openfeign.form</groupId>
    <artifactId>feign-form-spring</artifactId>
    <version>3.2.2</version>
</dependency>
<dependency>
    <groupId>io.github.openfeign.form</groupId>
    <artifactId>feign-form</artifactId>
    <version>3.2.2</version>
</dependency>
```

文件编码配置：
``` java
import feign.codec.Encoder;
import feign.form.spring.SpringFormEncoder;
import org.springframework.beans.factory.ObjectFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.web.HttpMessageConverters;
import org.springframework.cloud.netflix.feign.support.SpringEncoder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class MultipartSupportConfig {

    @Autowired
    private ObjectFactory<HttpMessageConverters> messageConverters;

    @Bean
    public Encoder feignFormEncoder() {
        return new SpringFormEncoder(new SpringEncoder(messageConverters));
    }

}
```

`Feign`接口定义：
``` java
@FeignClient(name = "test-upload")
public interface UploadService {

    @ResponseBody
    @RequestMapping(value = "/upload", method = {RequestMethod.POST},
            produces = {MediaType.APPLICATION_JSON_UTF8_VALUE},
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Result<String> uploadFile(@RequestPart("file") MultipartFile file,
                               @RequestParam("id") Long id);

}
```
与普通`Feign`接口写法差不多，注意方法注解和参数与服务提供者的`controller`一样。

`Controller`的写法，`Controller`中接收前端传过来的文件信息和额外参数，然后通过`Feign`接口传输到远端：
``` java

// 注入 feign 接口
@Autowired
private UploadService uploadService;

@RequestMapping(value = "/upload", method = RequestMethod.POST, produces = "application/json; charset=utf-8")
@ResponseBody
public Result<String> testUpload(HttpServletRequest request, Long id) {
    Result<String> result = null;
    MultipartHttpServletRequest mRequest = (MultipartHttpServletRequest) request;
    Map<String, MultipartFile> fileMap = mRequest.getFileMap();
    for (MultipartFile mFile : fileMap.values()) {
        String fileName = mFile.getOriginalFilename();
        result = uploadService.uploadFile(mFile, id);
    }
    return result;
}
```

### 四、总结

最后梳理一下流程，服务消费者接收前端（如浏览器）传过来的文件，但是并不进行业务处理，然后通过`Feign`调用接口，把文件传给服务提供者，服务提供者拿到文件后，进行相应的业务处理。