---
title: Spring Boot中如何干掉if else
date: 2019-02-02 11:25
categories: 技术
tags: [java,spring-boot,spring-cloud] 
---

### 前言

看到crossoverJie的文章[《利用策略模式优化过多 if else 代码》][1]后受到启发，可以利用策略模式简化过多的`if else`代码，文章中提到可以通过扫描实现处理器的自注册，我在这里介绍在Spring Boot框架中的实现方法。

### 需求

这里虚拟一个业务需求，让大家容易理解。假设有一个订单系统，里面的一个功能是根据订单的不同类型作出不同的处理。

订单实体：
``` java
public class OrderDTO {
    
    private String code;

    private BigDecimal price;

    /**
     * 订单类型
     * 1：普通订单；
     * 2：团购订单；
     * 3：促销订单；
     */
    private String type;
    
    // ... 省略 get / set ...
    
}
```

`service`接口：
``` java
public interface IOrderService {

    /**
     * 根据订单的不同类型作出不同的处理
     *
     * @param dto 订单实体
     * @return 为了简单，返回字符串
     */
    String handle(OrderDTO dto);

}
```

### 传统实现

根据订单类型写一堆的`if else`：
``` java
public class OrderServiceImpl implements IOrderService {

    @Override
    public String handle(OrderDTO dto) {
        String type = dto.getType();
        if ("1".equals(type)) {
            return "处理普通订单";
        } else if ("2".equals(type)) {
            return "处理团购订单";
        } else if ("3".equals(type)) {
            return "处理促销订单";
        }
        return null;
    }

}
```

### 策略模式实现

利用策略模式，只需要两行即可实现业务逻辑：
``` java
@Service
public class OrderServiceV2Impl implements IOrderService {

    @Autowired
    private HandlerContext handlerContext;

    @Override
    public String handle(OrderDTO dto) {
        AbstractHandler handler = handlerContext.getInstance(dto.getType());
        return handler.handle(dto);
    }

}
```

可以看到上面的方法中注入了`HandlerContext`，这是一个处理器上下文，用来保存不同的业务处理器，具体在下文会讲解。我们从中获取一个抽象的处理器`AbstractHandler`，调用其方法实现业务逻辑。

现在可以了解到，我们主要的业务逻辑是在处理器中实现的，因此有多少个订单类型，就对应有多少个处理器。以后需求变化，增加了订单类型，只需要添加相应的处理器就可以，上述`OrderServiceV2Impl`完全不需改动。

我们先看看业务处理器的写法：
``` java
@Component
@HandlerType("1")
public class NormalHandler extends AbstractHandler {

    @Override
    public String handle(OrderDTO dto) {
        return "处理普通订单";
    }

}
```
``` java
@Component
@HandlerType("2")
public class GroupHandler extends AbstractHandler {

    @Override
    public String handle(OrderDTO dto) {
        return "处理团购订单";
    }

}
```
``` java
@Component
@HandlerType("3")
public class PromotionHandler extends AbstractHandler {

    @Override
    public String handle(OrderDTO dto) {
        return "处理促销订单";
    }

}
```

首先每个处理器都必须添加到`spring`容器中，因此需要加上`@Component`注解，其次需要加上一个自定义注解`@HandlerType`，用于标识该处理器对应哪个订单类型，最后就是继承`AbstractHandler`，实现自己的业务逻辑。

自定义注解 `@HandlerType`：
``` java
@Target({ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Inherited
public @interface HandlerType {

    String value();

}
```

抽象处理器 `AbstractHandler`：
``` java
public abstract class AbstractHandler {
    abstract public String handle(OrderDTO dto);
}
```

自定义注解和抽象处理器都很简单，那么如何将处理器注册到`spring`容器中呢？
具体思路是：

- 扫描指定包中标有`@HandlerType`的类；
- 将注解中的类型值作为`key`，对应的类作为`value`，保存在`Map`中；
- 以上面的`map`作为构造函数参数，初始化`HandlerContext`，将其注册到`spring`容器中；

我们将核心的功能封装在`HandlerProcessor`类中，完成上面的功能。

`HandlerProcessor`：
``` java
@Component
@SuppressWarnings("unchecked")
public class HandlerProcessor implements BeanFactoryPostProcessor {

    private static final String HANDLER_PACKAGE = "com.cipher.handler_demo.handler.biz";

    /**
     * 扫描@HandlerType，初始化HandlerContext，将其注册到spring容器
     *
     * @param beanFactory bean工厂
     * @see HandlerType
     * @see HandlerContext
     */
    @Override
    public void postProcessBeanFactory(ConfigurableListableBeanFactory beanFactory) throws BeansException {
        Map<String, Class> handlerMap = Maps.newHashMapWithExpectedSize(3);
        ClassScaner.scan(HANDLER_PACKAGE, HandlerType.class).forEach(clazz -> {
            // 获取注解中的类型值
            String type = clazz.getAnnotation(HandlerType.class).value();
            // 将注解中的类型值作为key，对应的类作为value，保存在Map中
            handlerMap.put(type, clazz);
        });
        // 初始化HandlerContext，将其注册到spring容器中
        HandlerContext context = new HandlerContext(handlerMap);
        beanFactory.registerSingleton(HandlerContext.class.getName(), context);
    }

}
```

[ClassScaner：扫描工具类源码][2]

`HandlerProcessor`需要实现`BeanFactoryPostProcessor`，在`spring`处理bean前，将自定义的bean注册到容器中。

核心工作已经完成，现在看看`HandlerContext`如何获取对应的处理器：

`HandlerContext`：
``` java
public class HandlerContext {

    private Map<String, Class> handlerMap;

    public HandlerContext(Map<String, Class> handlerMap) {
        this.handlerMap = handlerMap;
    }

    public AbstractHandler getInstance(String type) {
        Class clazz = handlerMap.get(type);
        if (clazz == null) {
            throw new IllegalArgumentException("not found handler for type: " + type);
        }
        return (AbstractHandler) BeanTool.getBean(clazz);
    }

}
```

[BeanTool：获取bean工具类][3]

`#getInstance`方法根据类型获取对应的class，然后根据class类型获取注册到`spring`中的bean。

最后请注意一点，`HandlerProcessor`和`BeanTool`必须能被扫描到，或者通过`@Bean`的方式显式的注册，才能在项目启动时发挥作用。

### 总结

利用策略模式可以简化繁杂的`if else`代码，方便维护，而利用自定义注解和自注册的方式，可以方便应对需求的变更。本文只是提供一个大致的思路，还有很多细节可以灵活变化，例如使用枚举类型、或者静态常量，作为订单的类型，相信你能想到更多更好的方法。

全部示例代码请查看：[handler_demo][4]

阅读原文：[http://www.ciphermagic.cn][5]

希望对你有所帮助：）


  [1]: https://juejin.im/post/5c5172d15188256a2334a15d
  [2]: https://github.com/ciphermagic/java-learn/blob/master/sandbox/src/main/java/com/cipher/handler_demo/util/ClassScaner.java
  [3]: https://github.com/ciphermagic/java-learn/blob/master/sandbox/src/main/java/com/cipher/handler_demo/util/BeanTool.java
  [4]: https://github.com/ciphermagic/java-learn/tree/master/sandbox/src/main/java/com/cipher/handler_demo
  [5]: http://www.ciphermagic.cn/spring-boot-without-if-else.html
  [6]: https://github.com/ciphermagic/java-learn/blob/master/sandbox/src/main/java/com/cipher/handler_demo/handler/HandlerProcessorV2.java
