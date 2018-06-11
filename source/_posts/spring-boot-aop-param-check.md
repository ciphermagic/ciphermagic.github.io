---
title: Spring Boot实现通用的接口参数校验
date: 2018-05-10 11:10
categories: 技术
tags: [spring-boot,java] 
---
![此处输入图片的描述][1]

本文介绍基于`Spring Boot`和`JDK8`编写一个`AOP`，结合自定义注解实现通用的接口参数校验。

<!-- more -->

### 缘由
目前参数校验常用的方法是在实体类上添加注解，但对于不同的方法，所应用的校验规则也是不一样的，例如有一个`AccountVO`实体：
``` java
public class AccountVO {
    private String name; // 姓名
    private Integer age; // 年龄
}
```
假设存在这样一个业务：用户注册时需要填写姓名和年龄，用户登陆时只需要填写姓名就可以了。那么把校验规则加在实体类上显然就不合适了。

所以一直想实现一种方法级别的参数校验，对于同一个实体参数，不同的方法可以应用不同的校验规则，由此便诞生了这个工具，而且在日常工作中使用了很久。

### 介绍

先来看看使用的方式：
``` java
@Service
public class TestImpl implements ITestService {

    @Override
    @Check({"name", "age"})
    public void testValid(AccountVO vo) {
        // ...
    }

}
```

其中方法上的`@Check`注解指明了参数`AccountVO`中的`name`、`age`属性不能为空。除了非空校验外，还支持大小判断、是否等于等校验：
``` java
@Check({"id>=8", "name!=aaa", "title<10"})
```

默认的错误信息会返回字段，错误原因和调用的方法，例如：
``` java
updateUserId must not null while calling testValid

id must >= 8 while calling testValid

name must != aaa while calling testValid
```

也支持自定义错误返回信息：
```
@Check({"title<=8:标题字数不超过8个字，含标点符号"})
public void testValid(TestPO po) {
    // ...
}
```
只需要在校验规则后加上`:`，后面写上自定义信息，就会替换默认的错误信息。

*PS：
核心原理是通过反射获取参数实体中的字段的值，然后根据规则进行校验，
所以目前只支持含有一个参数的方法，并且参数不能是基础类型。*

### 使用

`spring-boot`中如何使用`AOP`这里不再赘述，主要介绍`AOP`中的核心代码。

#### Maven 依赖
除了`spring-boot`依赖之外，需要的第三方依赖，不是核心的依赖，可以根据个人习惯取舍：
``` xml
<!-- 用于字符串校验 -->
<dependency>
    <groupId>org.apache.commons</groupId>
    <artifactId>commons-lang3</artifactId>
    <version>3.3.2</version>
</dependency>

<!-- 用于日志打印 -->
<dependency>
    <groupId>org.slf4j</groupId>
    <artifactId>slf4j-api</artifactId>
    <version>1.7.25</version>
</dependency>
```

#### 自定义注解
``` java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.Target;

import static java.lang.annotation.RetentionPolicy.RUNTIME;

/**
 * 参数校验 注解
 * Created by cipher on 2017/9/20.
 */
@Target({ElementType.TYPE, ElementType.METHOD})
@Retention(RUNTIME)
public @interface Check {

    // 字段校验规则，格式：字段名+校验规则+冒号+错误信息，例如：id<10:ID必须少于10
    String[] value();

}
```

#### 核心代码

通过切面拦截加上了`@Check`注解的接口方法，在方法执行前，执行参数校验，如果存在错误信息，则直接返回：

``` java
@Around(value = "@com.cipher.checker.Check") // 这里要换成自定义注解的路径
public Object check(ProceedingJoinPoint point) throws Throwable {
    Object obj;
    // 参数校验
    String msg = doCheck(point);
    if (!StringUtils.isEmpty(msg)) {
        // 这里可以返回自己封装的返回类
        throw new IllegalArgumentException(msg);
    }
    obj = point.proceed();
    return obj;
}
```

核心的校验方法在`doCheck`方法中，主要原理是获取注解上指定的字段名称和校验规则，通过反射获取参数实体中对应的字段的值，再进行校验：

``` java
/**
 * 参数校验
 *
 * @param point ProceedingJoinPoint
 * @return 错误信息
 */
private String doCheck(ProceedingJoinPoint point) {
    // 获取方法参数值
    Object[] arguments = point.getArgs();
    // 获取方法
    Method method = getMethod(point);
    String methodInfo = StringUtils.isEmpty(method.getName()) ? "" : " while calling " + method.getName();
    String msg = "";
    if (isCheck(method, arguments)) {
        Check annotation = method.getAnnotation(Check.class);
        String[] fields = annotation.value();
        Object vo = arguments[0];
        if (vo == null) {
            msg = "param can not be null";
        } else {
            for (String field : fields) {
                // 解析字段
                FieldInfo info = resolveField(field, methodInfo);
                // 获取字段的值
                Object value = ReflectionUtil.invokeGetter(vo, info.field);
                // 执行校验规则
                Boolean isValid = info.optEnum.fun.apply(value, info.operatorNum);
                msg = isValid ? msg : info.innerMsg;
            }
        }
    }
    return msg;
}
```
可以看到主要的逻辑是：

解析字段 -> 获取字段的值 -> 执行校验规则

内部维护一个枚举类，相关的校验操作都在里面指定：
``` java
/**
 * 操作枚举
 */
enum Operator {
    /**
     * 大于
     */
    GREATER_THAN(">", CheckParamAspect::isGreaterThan),
    /**
     * 大于等于
     */
    GREATER_THAN_EQUAL(">=", CheckParamAspect::isGreaterThanEqual),
    /**
     * 小于
     */
    LESS_THAN("<", CheckParamAspect::isLessThan),
    /**
     * 小于等于
     */
    LESS_THAN_EQUAL("<=", CheckParamAspect::isLessThanEqual),
    /**
     * 不等于
     */
    NOT_EQUAL("!=", CheckParamAspect::isNotEqual),
    /**
     * 不为空
     */
    NOT_NULL("not null", CheckParamAspect::isNotNull);

    private String value;
    private BiFunction<Object, String, Boolean> fun;

    Operator(String value, BiFunction<Object, String, Boolean> fun) {
        this.value = value;
        this.fun = fun;
    }
}
```

由于篇幅原因，这里就不一一展开所有的代码，有兴趣的朋友可以到以下地址获取所有的源码：
[ciphermagic/java-learn/sandbox/checker][2]

#### TODO
- 以Spring Boot Starter的方式封装成独立组件
- 支持正则表达式验证

### 最后
感谢大家的阅读，喜欢的朋友可以在[github][3]上点个赞，有任何问题或者建议请在下方留言，期待你的回复。


  [1]: http://images.ciphermagic.cn/param-check.jpg-blog
  [2]: https://github.com/ciphermagic/java-learn/tree/master/sandbox/src/main/java/com/cipher/checker
  [3]: https://github.com/ciphermagic/java-learn