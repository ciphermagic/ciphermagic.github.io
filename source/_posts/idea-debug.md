---
title: IntelliJ IDEA前后端调试技巧
date: 2017-08-25 15:02:32
tags: [idea]
categories: 技术
---

### IntelliJ IDEA 配置chrome调试js代码
基于Chrome浏览器的调试方式，首先在Chrome中安装jetbrains ide support插件，并在IDEA中配置debug启动方式：
    ![此处输入图片的描述][1]
在打开的界面中，新增一个JavaScript Debug，并设置名称和URL：
    ![此处输入图片的描述][2]
最后在js中打断点，然后在IDEA中debug启动即可。

### IntelliJ IDEA 使用Rest Client测试接口
首先打开restful测试功能：
    ![此处输入图片的描述][3]
即可打开Rest Client窗口，设置相应参数，注意json请求数据要写在text中：
    ![此处输入图片的描述][4]
    
以上就是IntelliJ IDEA的调试技巧，使用一个IDE就可以开发和调试前后端代码，是不是很方便呢：）


  [1]: http://images.ciphermagic.cn/n-dubug-js-1.png-pic
  [2]: http://images.ciphermagic.cn/n-dubug-js-2.png-pic
  [3]: http://images.ciphermagic.cn/n-rest-1.png-pic
  [4]: http://images.ciphermagic.cn/n-rest-2.png-pic
