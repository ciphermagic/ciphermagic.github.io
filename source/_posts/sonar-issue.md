---
title: sonar质量分析 Tabulation characters should not be used 原因与解决
date: 2015-12-22 15:48
categories: blog
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

![](http://ww2.sinaimg.cn/large/6af06d97gw1ergh3aoyd8j20h30cadhv.jpg)

#### 第二步
点击 window->preference-,依次选择 java（或C++）->code style ->formatter,点击右侧的editor，选则左侧 tab policy的值为spaces only,确定，应用保存即可，如下图所示：

![](http://ww3.sinaimg.cn/large/6af06d97gw1ergh3bdz3qj20j00cb40g.jpg)

![](http://ww3.sinaimg.cn/large/6af06d97gw1ergh3c1rugj20ss06q75t.jpg)

若出现应用Apply按钮为灰色的情况，需要回到上一步，点击new按钮，根据当前的样式重新生成一个新的样式并保存，重复第二步，编辑该样式即可，如下图： 

![](http://ww4.sinaimg.cn/large/6af06d97gw1ergh3crmmij20jn0ilad1.jpg)

![](http://ww2.sinaimg.cn/large/6af06d97gw1ergh3d9na3j20as067gly.jpg)

注意编辑完要选择新建的这个样式。

> 参考：
[sonar质量分析不让用tab，说要使用空格，大家怎么看？](http://www.oschina.net/question/1772009_166774)，
[设置Eclipse中的tab键为4个空格的完整方法](http://my.oschina.net/xunxun10/blog/110074)

-END-