---
title: Spring Cloud Feign 熔断机制填坑
date: 2018-06-13 11:47
categories: 技术
tags: [spring-cloud] 
---

### 问题

最近在项目开发中，使用 Feign 调用服务，当触发熔断机制时，遇到了以下问题：

- 异常信息形如：`TestService#addRecord(ParamVO) failed and no fallback available.`；
- 获取不到服务提供方抛出的原始异常信息；
- 实现某些业务方法不进入熔断，直接往外抛出异常；

<!-- more -->

接下来将一一解决上述问题。

对于`failed and no fallback available.`这种异常信息，是因为项目开启了熔断：
``` yml
feign.hystrix.enabled: true
```
**当调用服务时抛出了异常，却没有定义`fallback`方法**，就会抛出上述异常。由此引出了第一个解决方式。

### `@FeignClient`加上`fallback`方法，并获取异常信息
为`@FeignClient`修饰的接口加上`fallback`方法有两种方式，由于要获取异常信息，所以使用`fallbackFactory`的方式：

``` java
@FeignClient(name = "serviceId", fallbackFactory = TestServiceFallback.class)
public interface TestService {

    @RequestMapping(value = "/get/{id}", method = RequestMethod.GET)
    Result get(@PathVariable("id") Integer id);
    
}
```

在`@FeignClient`注解中指定`fallbackFactory`，上面例子中是`TestServiceFallback`：

``` java
import feign.hystrix.FallbackFactory;
import org.apache.commons.lang3.StringUtils;

@Component
public class TestServiceFallback implements FallbackFactory<TestService> {

    private static final Logger LOG = LoggerFactory.getLogger(TestServiceFallback.class);

    public static final String ERR_MSG = "Test接口暂时不可用: ";

    @Override
    public TestService create(Throwable throwable) {
        String msg = throwable == null ? "" : throwable.getMessage();
        if (!StringUtils.isEmpty(msg)) {
            LOG.error(msg);
        }
        return new TestService() {
            @Override
            public String get(Integer id) {
                return ResultBuilder.unsuccess(ERR_MSG + msg);
            }
        };
    }
}
```

通过实现`FallbackFactory`,可以在`create`方法中获取到服务抛出的异常。**但是请注意，这里的异常是被`Feign`封装过的异常**，不能直接在异常信息中看出原始方法抛出的异常。这时得到的异常信息形如：

``` java
status 500 reading TestService#addRecord(ParamVO); content:
{"success":false,"resultCode":null,"message":"/ by zero","model":null,"models":[],"pageInfo":null,"timelineInfo":null,"extra":null,"validationMessages":null,"valid":false}
```

说明一下，本例子中，服务提供者的接口返回信息会统一封装在自定义类`Result`中，内容就是上述的`content`：

``` json
{"success":false,"resultCode":null,"message":"/ by zero","model":null,"models":[],"pageInfo":null,"timelineInfo":null,"extra":null,"validationMessages":null,"valid":false}
```

因此，异常信息我希望是`message`的内容：`/ by zero`，这样打日志时能够方便识别异常。

### 保留原始异常信息

当调用服务时，如果服务返回的状态码不是200，就会进入到`Feign`的`ErrorDecoder`中，因此如果我们要解析异常信息，就要重写`ErrorDecoder`：

``` java
import feign.Response;
import feign.Util;
import feign.codec.ErrorDecoder;

/**
 * @Author: CipherCui
 * @Description: 保留 feign 服务异常信息
 * @Date: Created in 1:29 2018/6/2
 */
public class KeepErrMsgConfiguration {

    @Bean
    public ErrorDecoder errorDecoder() {
        return new UserErrorDecoder();
    }

    /**
     * 自定义错误解码器
     */
    public class UserErrorDecoder implements ErrorDecoder {

        private Logger logger = LoggerFactory.getLogger(getClass());

        @Override
        public Exception decode(String methodKey, Response response) {
            Exception exception = null;
            try {
                // 获取原始的返回内容
                String json = Util.toString(response.body().asReader());
                exception = new RuntimeException(json);
                // 将返回内容反序列化为Result，这里应根据自身项目作修改
                Result result = JsonMapper.nonEmptyMapper().fromJson(json, Result.class);
                // 业务异常抛出简单的 RuntimeException，保留原来错误信息
                if (!result.isSuccess()) {
                    exception = new RuntimeException(result.getMessage());
                }
            } catch (IOException ex) {
                logger.error(ex.getMessage(), ex);
            }
            return exception;
        }
    }

}
```

上面是一个例子，**原理是根据`response.body()`反序列化为自定义的`Result`类，提取出里面的`message`信息，然后抛出`RuntimeException`，这样当进入到熔断方法中时，获取到的异常就是我们处理过的`RuntimeException`。**

注意上面的例子并不是通用的，但原理是相通的，大家要结合自身的项目作相应的修改。

要使上面代码发挥作用，还需要在`@FeignClient`注解中指定`configuration`：

``` java
@FeignClient(name = "serviceId", fallbackFactory = TestServiceFallback.class, configuration = {KeepErrMsgConfiguration.class})
public interface TestService {

    @RequestMapping(value = "/get/{id}", method = RequestMethod.GET)
    String get(@PathVariable("id") Integer id);
    
}
```

### 不进入熔断，直接抛出异常

有时我们并不希望方法进入熔断逻辑，只是把异常原样往外抛。这种情况我们只需要捉住两个点：**不进入熔断**、**原样**。

原样就是获取原始的异常，上面已经介绍过了，而不进入熔断，需要把异常封装成`HystrixBadRequestException`，**对于`HystrixBadRequestException`，`Feign`会直接抛出，不进入熔断方法。**

因此我们只需要在上述`KeepErrMsgConfiguration`的基础上作一点修改即可：

``` java
/**
 * @Author: CipherCui
 * @Description: feign 服务异常不进入熔断
 * @Date: Created in 1:29 2018/6/2
 */
public class NotBreakerConfiguration {

    @Bean
    public ErrorDecoder errorDecoder() {
        return new UserErrorDecoder();
    }

    /**
     * 自定义错误解码器
     */
    public class UserErrorDecoder implements ErrorDecoder {

        private Logger logger = LoggerFactory.getLogger(getClass());

        @Override
        public Exception decode(String methodKey, Response response) {
            Exception exception = null;
            try {
                String json = Util.toString(response.body().asReader());
                exception = new RuntimeException(json);
                Result result = JsonMapper.nonEmptyMapper().fromJson(json, Result.class);
                // 业务异常包装成 HystrixBadRequestException，不进入熔断逻辑
                if (!result.isSuccess()) {
                    exception = new HystrixBadRequestException(result.getMessage());
                }
            } catch (IOException ex) {
                logger.error(ex.getMessage(), ex);
            }
            return exception;
        }
    }

}
```

### 总结
为了更好的达到熔断效果，我们应该为每个接口指定`fallback`方法。而根据自身的业务特点，可以灵活的配置上述的`KeepErrMsgConfiguration`和`NotBreakerConfiguration`，或自己编写`Configuration`。

以上例子特殊性较强，不足之处请不吝指教。希望大家可以从中获取到有用的东西，应用到自己的项目中，感谢阅读。