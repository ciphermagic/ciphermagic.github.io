---
title: CentOS 7 防范暴力破解
date: 2017-12-07 09:03
categories: 技术
tags: [centos] 
---

前段时间在国外的服务器上搭建了CentOS，没想到过了几天上去一看，有2万多次的尝试登陆记录：

``` shell
# 查看系统登陆日志
vim /var/log/secure
```

顿时吓尿了，后来经过一番搜查，定下了两个防范措施：

- 修改ssh默认端口
- 封掉登陆尝试次数过多的ip

## 修改ssh默认端口

### 开放新的端口
``` shell
# 开放端口
firewall-cmd --zone=public --add-port=20000/tcp --permanent
# 重启防火墙
firewall-cmd --reload
```

### 修改/etc/ssh/sshd_config
``` shell
vi /etc/ssh/sshd_config
#Port 22         //这行去掉#号
Port 20000      //下面添加这一行
```

### 重启ssh
``` shell
systemctl restart sshd.service
```

## 安装和配置DenyHosts
DenyHosts是Python语言写的一个程序，它会分析sshd的日志文件（/var/log/secure），当发现重 复的攻击时就会记录IP到/etc/hosts.deny文件，从而达到自动屏IP的功能。

### 安装denyhosts
``` shell
# 更新系统（建议所有系统都先更新）
yum update

# 安装denyhosts
sudo yum install denyhosts

# 加入开机启动
$ chkconfig --add denyhosts

# 配置完后重启denyhosts
$ /etc/init.d/denyhosts restart

# 查看denyhosts收集到的恶意ip
$ cat /etc/hosts.deny
$ cat /etc/hosts.deny | wc -l
```

### denyhosts配置详解
默认配置就能很好的工作，如要个性化设置可以修改 /etc/denyhosts.conf

``` log
############ THESE SETTINGS ARE REQUIRED ############
SECURE_LOG = /var/log/secure    #sshd的日志文件  
HOSTS_DENY = /etc/hosts.deny  #将阻止IP写入到hosts.deny,所以这个工具只支持 支持tcp wrapper的协议  
PURGE_DENY = 4w  #过多久后清除已阻止的IP,即阻断恶意IP的时长  （4周）  
BLOCK_SERVICE  = sshd  #阻止服务名  
DENY_THRESHOLD_INVALID = 5  #允许无效用户登录失败的次数  
DENY_THRESHOLD_VALID = 10  #允许普通有效用户登录失败的次数  
DENY_THRESHOLD_ROOT = 1    #允许root登录失败的次数  
DENY_THRESHOLD_RESTRICTED = 1    #设定 deny host 写入到该资料夹  
WORK_DIR = /var/lib/denyhosts    #将deny的host或ip记录到work_dir中  
SUSPICIOUS_LOGIN_REPORT_ALLOWED_HOSTS=YES  
HOSTNAME_LOOKUP=YES    #是否做域名反解  
LOCK_FILE = /var/lock/subsys/denyhosts    #将DenyHost启动的pid记录到LOCK_FILE中，已确保服务正确启动，防止同时启动多个服务

############ THESE SETTINGS ARE OPTIONAL ############
ADMIN_EMAIL = root  #设置管理员邮件地址  
SMTP_HOST = localhost  
SMTP_PORT = 25  
SMTP_FROM = DenyHosts &lt;nobody@localhost&gt;  
SMTP_SUBJECT = DenyHosts Report from $[HOSTNAME]  
AGE_RESET_VALID=5d  
AGE_RESET_ROOT=25d  
AGE_RESET_RESTRICTED=25d  
AGE_RESET_INVALID=10d

######### THESE SETTINGS ARE SPECIFIC TO DAEMON MODE  ##########
DAEMON_LOG = /var/log/denyhosts  #denyhost服务日志文件

DAEMON_SLEEP = 30s  
DAEMON_PURGE = 1h      #该项与PURGE_DENY 设置成一样，也是清除hosts.deniedssh 用户的时间
```

### 启动命令

``` shell
service denyhosts start
service denyhosts stop
service denyhosts status

# 加入自启动
chkconfig denyhosts on
```