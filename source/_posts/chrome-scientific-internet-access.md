---
title: 使用虚拟机实现灵活的科学上网
date: 2017-04-17 11:37
categories: 技术
tags: [科学上网] 
---

## 缘由
笔者一直使用[ExpressVPN][1]作为梯子，ExpressVPN是国外的收费VPN工具，最近官网不是很稳定，可能要翻墙才能登上。ExpressVPN有windows下的管理工具，一键链接，方便快捷，且速度在同类工具中算得上突出，但是美中不足的是，跟很多VPN工具一样，ExpressVPN只支持全局代理，没有提供浏览器插件之类的东西。然而在平常的使用当中只是上google等一些国外网站才需要vpn，频繁的开关代理显得格外的麻烦和耗时，因此便萌生一种实现灵活可切换的科学上网方式的想法。

*windows下的ExpressVPN工具：*
![windows下的ExpressVPN工具][2]

## 实现思路
在宿主机（windows10）下安装虚拟机（ubuntu），在虚拟机中安装ExpressVPN对应的安装包，这里是expressvpn_1.2.0_amd64.deb，这样虚拟机即可连接vpn实现科学上网。要让外部的宿主机也能使用vpn，就要在虚拟机中搭建一个http代理服务器，这里使用squid，并开启代理服务。最后，在宿主机的chrome浏览器中安装SwitchyOmega插件，把代理地址指向虚拟机的ip和squid监听的端口，当我们需要访问国外网站时，只需切换插件的代理模式即可。

## 环境
- 宿主机：Windows10 64位
- 虚拟机：Ubuntu-16.04.1-server-amd64
- 浏览器：Chrome
- vpn工具：ExpressVPN

## 说明
笔者的虚拟机是使用win10自带的Hyper-V虚拟机工具安装的，虚拟机与宿主机可以互相ping通，并可访问外网。本文使用的vpn工具是ExpressVPN，其他vpn工具只要支持linux环境，实现方式也是一样的。

## 实现步骤

### 安装VPN软件
```
sudo dpkg -i expressvpn_1.2.0_amd64.deb
```
![此处输入图片的描述][3]

ExpressVPN需要填写激活码：
```
expressvpn activate
```
![此处输入图片的描述][4]

输入n，不向ExpressVPN分享信息：
![此处输入图片的描述][5]

连接国外节点：
```
expressvpn connect
```

这样即可使用ExpressVPN，可以ping一下www.google.com验证能否ping通。更多ExpressVPN相关的命令可以查看[官网][6]，这里就不多做介绍了，毕竟不是所有人都是用ExpressVPN。

### 安装Squid
[Squid][7]是一个高性能的代理缓存服务器，Squid支持FTP、gopher和HTTP协议。这里即是使用它的Http代理功能。

```
apt-get install squid
```

### 配置Squid
修改/etc/squid/squid.conf
```
vim /etc/squid/squid.conf
```

找到 http_access deny all ，将 deny 改成 allow 。意思是允许任何IP使用这个代理。
```
http_access allow all
```

配置端口，这是服务器的监听端口，也就是客户端连接服务器时配置的端口，这里保持默认。
```
http_port 3128
```

重启squid
```
service squid restart
```

### 安装Chrome插件：SwitchyOmega

![此处输入图片的描述][8]

### 配置代理方式

代理服务器为虚拟机的ip地址，代理端口为squid配置的监听端口
![此处输入图片的描述][9]

### 开始使用
安装配置完SwitchyOmega，会在浏览器的右上角出现SwitchyOmega的图标，里面有刚刚配置的代理方式【ExpressVPN】。在需要翻墙的时候，点击【ExpressVPN】即可。或者可以指定某些url使用代理方式，其他使用直连的方式，这样选择当【auto switch】方式时，即可根据不同的访问地址，自动选择对应的代理方式。
![此处输入图片的描述][10]

## 总结
由于虚拟机是一直运行着的，使用SwitchyOmega插件仅仅是切换浏览器连接的代理方式，这样便省去了在全局代理时每次都要重新连接vpn节点的时间。经过上文的描述，我们实际上是搭建了一台内网的vpn服务器，如果内网中有多台电脑或其他设备，只需安装类似SwitchyOmega的代理插件连接到这台vpn服务器，就可以实现科学上网了。


  [1]: https://www.expressvpn.com/
  [2]: http://ww4.sinaimg.cn/large/698f7fe7gy1fepfqray3pj20am0go75q.jpg
  [3]: https://2y0ge4lrxiko1n2r1be9ibxk-wpengine.netdna-ssl.com/wp-content/uploads/2016/03/installer-command.png
  [4]: https://2y0ge4lrxiko1n2r1be9ibxk-wpengine.netdna-ssl.com/wp-content/uploads/2016/03/activate-expressvpn.png
  [5]: https://2y0ge4lrxiko1n2r1be9ibxk-wpengine.netdna-ssl.com/wp-content/uploads/2016/03/sharing-information.png
  [6]: www.expressvpn.com
  [7]: http://baike.baidu.com/link?url=Zxt1x4-IkZNBUndGuz6gMDqSZM3REYRHdwk-6zd5rQn8XggYMCIuAvwqGWLBAQhOVOqKsf9ZsjfPGMGyzaB3sq
  [8]: http://ww4.sinaimg.cn/large/698f7fe7gy1fepfqrf9rmj20mx05a3ym.jpg
  [9]: http://ww4.sinaimg.cn/large/698f7fe7gy1fepfqrl54yj218g0leab5.jpg
  [10]: http://ww4.sinaimg.cn/large/698f7fe7gy1fepfqscytzj204o05ta9y.jpg