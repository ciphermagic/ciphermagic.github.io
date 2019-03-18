---
title: Spring Aop中解析spel表达式，实现更灵活的功能
date: 2019-02-25 17:11
categories: 技术
tags: [spring] 
---


### 前言

在Spring Aop中，我们可以拿到拦截方法的参数，如果能结合spel表达式，就能实现更加灵活的功能。典型的实现有Spring的缓存注解：

``` java
@Cacheable(value = "user", key = "#id", condition = "#id lt 10")
public User conditionFindById(final Long id) {
}
```

``` java
@Caching(put = {
@CachePut(value = "user", key = "#user.id"),
@CachePut(value = "user", key = "#user.username"),
@CachePut(value = "user", key = "#user.email")
})
public User save(User user) {
```

本文介绍如何在aop编程中解析spel表达式，提供几个通用的方法。

Spring使用自定义注解实现aop的方式这里就不赘述，只着重介绍如何解析spel。

### 准备

实现非常简单，Spring本身就提供了简便的api，我们只需要获取：

- 方法：`Method method`
- 方法参数：`Object[] arguments`
- spel表达式：`String spel`

这些都能从aop入口方法的参数`ProceedingJoinPoint`中得到。

spel表达式显然就是从自定义注解中获取了，而获取方法和参数的方式如下：

获取方法：
``` java
private Method getMethod(ProceedingJoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        if (method.getDeclaringClass().isInterface()) {
            try {
                method = joinPoint
                        .getTarget()
                        .getClass()
                        .getDeclaredMethod(joinPoint.getSignature().getName(),
                                method.getParameterTypes());
            } catch (SecurityException | NoSuchMethodException e) {
                throw new RuntimeException(e);
            }
        }
        return method;
    }
```

获取方法参数值：
``` java
Object[] arguments = joinPoint.getArgs();
```

### 解析

然后就是解析spel表达式，首先在aop类中定义两个属性：
``` java
private ExpressionParser parser = new SpelExpressionParser();

private LocalVariableTableParameterNameDiscoverer discoverer = new LocalVariableTableParameterNameDiscoverer();
```

根据spel表达式解析参数，得到结果：
``` java
    /**
     * 解析 spel 表达式
     *
     * @param method    方法
     * @param arguments 参数
     * @param spel      表达式
     * @param clazz     返回结果的类型
     * @param defaultResult 默认结果
     * @return 执行spel表达式后的结果
     */
    private <T> T parseSpel(Method method, Object[] arguments, String spel, Class<T> clazz, T defaultResult) {
        String[] params = discoverer.getParameterNames(method);
        EvaluationContext context = new StandardEvaluationContext();
        for (int len = 0; len < params.length; len++) {
            context.setVariable(params[len], arguments[len]);
        }
        try {
            Expression expression = parser.parseExpression(spel);
            return expression.getValue(context, clazz);
        } catch (Exception e) {
            return defaultResult;
        }
    }
```

### 总结

上述就是整个解析spel表达式的关键流程，整体来看，aop类的结构是这样的：
``` java
@Aspect
public class SpelAspect {

    private ExpressionParser parser = new SpelExpressionParser();
    private LocalVariableTableParameterNameDiscoverer discoverer = new LocalVariableTableParameterNameDiscoverer();
    
    @Around(value = "@annotation(自定义注解)")
    public Object test(ProceedingJoinPoint point) throws Throwable {
        Object obj;
        // 获取方法参数值
        Object[] arguments = point.getArgs();
        // 获取方法
        Method method = getMethod(point);
        // 从注解中获取spel字符串，省略...
        String spel = ...
        // 解析spel表达式
        Boolean result = parseSpel(method, arguments, spel, Boolean.class, Boolean.FALSE);
        // 业务操作，省略...
        ...
        return point.proceed();
    }
}
```

以上提供一个基本思路和几个通用的方法（`#getMethod`、`#parseSpel`），接下来就是大家发挥想象力的时间啦！