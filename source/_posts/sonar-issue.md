---
title: sonar质量分析 Tabulation characters should not be used 原因与解决
date: 2015-12-22 15:48
categories: 技术
tags: [sonar] 
---

## 缘由

项目中使用sonar质量分析，很多代码提示：Replace all tab characters in this file by sequences of white-spaces.

> ### Tabulation characters should not be used 
Developers should not need to configure the tab width of their text editors in order to be able to read source code. So the use of tabulation character must be banned. 

这是因为编辑器不一样默认的tab的宽度或在不同系统下显示的效果不同，考虑到代码跨平台的可读性，应该将tab统一换成空格。

## 	解决

将编辑器中的tab换成空格，以Eclipse为例。

### 设置Eclipse中的tab键为4个空格

#### 第一步

点击 window->preference-,依次选择 General->Editors->Text Editors,选中右侧的 insert space for tabs;如下图所示，保存，第一步完成；

![](https://files.ciphermagic.cn/sonar1.jpg)

#### 第二步
点击 window->preference-,依次选择 java（或C++）->code style ->formatter,点击右侧的editor，选则左侧 tab policy的值为spaces only,确定，应用保存即可，如下图所示：

![](https://files.ciphermagic.cn/sonar2.jpg)

![](https://files.ciphermagic.cn/sonar3.jpg)

若出现应用Apply按钮为灰色的情况，需要回到上一步，点击new按钮，根据当前的样式重新生成一个新的样式并保存，重复第二步，编辑该样式即可，如下图： 

![](https://files.ciphermagic.cn/sonar4.jpg)

![](https://files.ciphermagic.cn/sonar5.jpg)

注意编辑完要选择新建的这个样式。

> 参考：
[sonar质量分析不让用tab，说要使用空格，大家怎么看？](http://www.oschina.net/question/1772009_166774)，
[设置Eclipse中的tab键为4个空格的完整方法](http://my.oschina.net/xunxun10/blog/110074)

-END-
