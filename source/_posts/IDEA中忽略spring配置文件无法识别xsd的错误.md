---
title: IDEA中忽略spring配置文件无法识别xsd的错误
categories: blog
tags: [idea,spring] 
---

有时我们在写spring配置文件的时候，会出现idea无法识别schema，导致报错。虽然说不影响执行，但看着那红色的波浪线确实有一点不爽，寻思着能不能忽略这个错误。最开始的想法是像忽略代码语法校验那样，在Inspections中去掉相关的校验，但发现Inspections中没有schema，xsd等相关的配置，直到发现了如下的方法。

<!-- more -->

### 错误提示

![错误][1]

### 解决方法
依次打开：Settings->Languages & Frameworks->Schemas and DTDs
把报错的xsd添加到忽略列表：
![解决1][2]

点击OK后会在忽略列表看到所加的地址：
![解决2][3]

### 世界又清静了
![此处输入图片的描述][4]


  [1]: http://ww4.sinaimg.cn/large/698f7fe7gy1fejvcnjlyuj20v20ckdhj.jpg
  [2]: http://ww4.sinaimg.cn/large/698f7fe7gy1fejvf7mdcrj20x30kn75j.jpg
  [3]: http://ww4.sinaimg.cn/large/698f7fe7gy1fejvf7yeykj20x30knjsd.jpg
  [4]: http://ww4.sinaimg.cn/large/698f7fe7gy1fejvf8spy1j20v20clq4f.jpg