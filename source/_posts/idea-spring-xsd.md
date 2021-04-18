---
title: IDEA中忽略spring配置文件无法识别xsd的错误
date: 2017-04-12 21:23:20
categories: 技术
tags: [idea] 
---

![错误][1]

<!-- more -->

有时我们在写spring配置文件的时候，会出现idea无法识别schema，导致报错。虽然说不影响执行，但看着那红色的波浪线确实有一点不爽，寻思着能不能忽略这个错误。最开始的想法是像忽略代码语法校验那样，在Inspections中去掉相关的校验，但发现Inspections中没有schema，xsd等相关的配置，直到发现了如下的方法。

### 解决方法
依次打开：Settings->Languages & Frameworks->Schemas and DTDs
把报错的xsd添加到忽略列表：
![解决1][2]

点击OK后会在忽略列表看到所加的地址：
![解决2][3]

### 世界又清静了
![此处输入图片的描述][4]


  [1]: https://files.ciphermagic.cn/xsd1.jpg
  [2]: https://files.ciphermagic.cn/xsd2.jpg
  [3]: https://files.ciphermagic.cn/xsd3.jpg
  [4]: https://files.ciphermagic.cn/xsd4.jpg
