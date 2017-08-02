---
title: UML类图
date: 2017-04-13 13:44:00
categories: 技术
---

UML类图理解

<!-- more -->

## 依赖关系

![此处输入图片的描述][2]

``` java
public class Person {  
    public void doSomething(){  
        Card card = new Card();//局部变量  
        ....  
    }  
} 
```

``` java
public class Person {  
    public void doSomething(Card card){//方法参数  
        ....  
    }  
}  
```

``` java
public class Person {  
    public void doSomething(){  
        int id = Card.getId();//静态方法调用  
        ...  
    }  
} 
```

## 关联关系

![此处输入图片的描述][3]

``` java
public class Person {  
    public Phone phone;  
      
    public void setPhone(Phone phone){        
        this.phone = phone;  
    }  
      
    public Phone getPhone(){          
        return phone;  
    }  
} 
```

## 聚合关系

![此处输入图片的描述][4]

``` java
public class Team {  
    public Person person;  
      
    public Team(Person person){  
        this.person = person;  
    }  
}  
```

## 组合关系

![此处输入图片的描述][5]

``` java
public class Person {  
    public Head head;  
    public Body body;  
    public Arm arm;  
    public Leg leg;  
      
    public Person(){  
        head = new Head();  
        body = new Body();  
        arm = new Arm();  
        leg = new Leg();  
    }  
} 
```

## 继承关系

![此处输入图片的描述][6]


  [1]: http://pic002.cnblogs.com/images/2012/457289/2012101817534290.jpg
  [2]: http://ww4.sinaimg.cn/large/698f7fe7gy1fel05wul86j20s5098gm9.jpg
  [3]: http://ww4.sinaimg.cn/large/698f7fe7gy1fel05vvsecj20q20973yy.jpg
  [4]: http://ww4.sinaimg.cn/large/698f7fe7gy1fel05wmwdcj20q20br0tq.jpg
  [5]: http://ww4.sinaimg.cn/large/698f7fe7gy1fel05wr3ysj20q20f3758.jpg
  [6]: http://ww4.sinaimg.cn/large/698f7fe7gy1fel05w7b5bj20q30eq757.jpg