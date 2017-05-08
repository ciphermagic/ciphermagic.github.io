title: Spring Boot启动后执行特定操作，然后自动停止
categories:
  - 技术
tags:
  - spring-boot
date: 2017-05-08 08:44:00
---
## 前言
我们原来使用Spring Boot一般都是在web工程中，执行顺序是启动内嵌tomcat容器→所有服务待命→等待请求的过来→处理请求，如此循环，当需要停止的话要在外部执行命令停止。

## 问题
但是问题来了，现在有一个特殊的需求，只需要Spring Boot执行一次，顺序是启动Spring Boot→执行service的一些方法→停止容器。整个过程不需要人工干预，Spring Boot启动后自动执行，执行后自动停止，不像原来那样挂起等待。

## 分析
首先分析一下需求，可以发现主要有两个特殊的点：
1、启动Spring Boot后执行特定的操作；
2、执行操作后自动停止；

## 解决
对于第一个问题，在网上很容易找到答案。只需要添加一个Listeners即可：
``` java
public class ApplicationStartup implements ApplicationListener<ContextRefreshedEvent> {

    public void onApplicationEvent(ContextRefreshedEvent event)     {
       // 想要执行的操作
    }
}
```
添加到SpringApplication中：
``` java
public static void main(String[] args) {
        SpringApplication springApplication = new SpringApplication(Application.class);
        springApplication.addListeners(new ApplicationStartup());
        springApplication.run(args);
    }
```

重点是第二个问题：**自动停止Spring Boot**，找遍了搜索引擎都没有找到方法，应该是这个需求比较奇葩，一般人不会这么用。可是遇到了问题还是要解决，于是我就想，什么情况下Spring Boot会停止呢？出现异常！是的，启动Spring Boot的过程中，只要出现异常，容器就会停止，这是开发过程中经常出现的问题。那么在发现异常的时候，肯定有某些机制，准确的说是某些代码使得容器停止。找到了线索，方法自然就有了，我在Spring Boot执行完操作后，就是在`ApplicationStartup`的最后手动的抛出了一个异常，然后开启debug模式，追踪进去：
发现在`EmbeddedWebApplicationContext`类中有一个非常明显的停止操作：
``` java
public final void refresh() throws BeansException, IllegalStateException {
        try {
            super.refresh();
        } catch (RuntimeException var2) {
            // 就是这句！
            this.stopAndReleaseEmbeddedServletContainer();
            throw var2;
        }
    }
```
进到方法，发现了位于`EmbeddedWebApplicationContext`类中的罪魁祸首：
``` java
private void stopAndReleaseEmbeddedServletContainer() {
        EmbeddedServletContainer localContainer = this.embeddedServletContainer;
        if(localContainer != null) {
            try {
                localContainer.stop();
                this.embeddedServletContainer = null;
            } catch (Exception var3) {
                throw new IllegalStateException(var3);
            }
        }

    }
```
就是这句`localContainer.stop()`！至此，我们知道了Spring Boot停止容器的方法，就是调用`EmbeddedServletContainer`的`stop`方法。所以我们只需要获取到`EmbeddedServletContainer`就可以了。

而要获取`EmbeddedServletContainer`，就要首先获取`EmbeddedWebApplicationContext`。观察`EmbeddedWebApplicationContext`，发现它叫做Context，那是否实现自`ApplicationContext`呢？通过引用关系，我发现它确实实现了`ApplicationContext`，这样就好办了，因为在日常开发中，我们经常要获取`ApplicationContext`和获取bean，已经封装有一个工具类`BeanTool`：
``` java
@Component
public class BeanTool extends ApplicationObjectSupport implements ApplicationContextAware {
    static ApplicationContext context;
    private static ApplicationContext applicationContext = null;

    public static void setApplicationContext(WebApplicationContext applicationContext) {
        BeanTool.applicationContext = applicationContext;
    }

    public BeanTool getInstance() {
        return new BeanTool();
    }

    protected void initApplicationContext(ApplicationContext context) {
        super.initApplicationContext(context);
        if (applicationContext == null) {
            applicationContext = context;
        }
    }

    public static ApplicationContext getAppContext() {
        return applicationContext;
    }

    public static Object getBean(String name) {
        return getAppContext().getBean(name);
    }

    public static Object getBean(Class clazz) {
        return getAppContext().getBean(clazz);
    }
}
```
这个工具类要注册到Spring Boot的入口类中：
``` java
    /**
     * bean工具类，可以在普通类中获取spring创建的bean
     */
    @Bean
    public BeanTool beanTool() {
        return new BeanTool();
    }
```
现在就差最后一步了！在`ApplicationStartup`的最后，调用`BeanTool`获取`EmbeddedWebApplicationContext`，从而获取`EmbeddedServletContainer`，最后调用其`stop`方法：
``` java
EmbeddedWebApplicationContext context = (EmbeddedWebApplicationContext)BeanTool.getAppContext();
context.getEmbeddedServletContainer().stop();
```
执行，可以看到执行完操作后，容器停止了，大功告成！

## 最后
从这个的经历中，可以看到问题的产生，问题的分析和问题的解决之中的是如何思考的。面对未知的问题，只要采取合适的方法，一步一步试错，一定能找到解决的方法。

> “你个人的项目，应该有四分之一会失败，否则就说明你的冒险精神不够。”（Expect and hope that a quarter of your projects fail. If not, you're not taking enough risks. --Adam Smith）