---
title: Python10行代码实现微信群聊天机器人
date: 2017-06-16 17:13
categories: 技术
tags: [python] 
---

### 前言
使用Python和图灵机器人很容易实现微信聊天机器人，但网上很多资料都是关于私聊的，很少提到群聊中的聊天机器人实现，本文提供了一个非常简单的方法。

### 实现

首先需要[wxpy][1]，wxpy 在 itchat 的基础上，通过大量接口优化提升了模块的易用性，并进行丰富的功能扩展。其次需要注册[图灵机器人][2]，注册后会得到api key。

安装wxpy：
``` bash
pip install -U wxpy
```

编写代码：
``` python
from wxpy import *
bot = Bot(cache_path=True)
my_group = bot.groups().search('群名称')[0]
tuling = Tuling(api_key='图灵机器人key')

@bot.register(my_group, except_self=False)
def reply_my_friend(msg):
    print(tuling.do_reply(msg))

embed()
```

代码解释：
第一行：引入wxpy；
第二行：初始化一个机器人；
第三行：搜索微信群；
第四行：初始化图灵机器人；
第六行：监听微信群消息；
第七行：定义自动回复函数；
第八行：输出回复信息；
第十行：进入 Python 命令行、让程序保持运行；

运行上述代码，将会弹出二维码图片，微信搜码登陆后即可。


  [1]: http://wxpy.readthedocs.io/zh/latest/
  [2]: http://tuling123.com/