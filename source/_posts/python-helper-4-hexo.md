---
title: Python3实现Hexo小助手
date: 2017-05-27 14:05
categories: 技术
tags: [python] 
---

## 前言
Hexo是一个基于nodejs的轻量级博客平台，由于它的简单、主题丰富等特点，收获了大量的拥趸。本博客也是基于Hexo，但是在使用Hexo部署和运营博客的过程中，发现了一些小问题。

<!-- more -->

## 问题
1、大部分使用Hexo的博主，都是把代码提交到github仓库。而且为了在不同环境都能方便编写博客，通常会把博客的源码（即博客配置文件，主题配置文件，样式布局文件等）和Hexo生成的代码（即public文件下的代码），同时提交到github仓库的不同分支上，如此在新环境下只要把博客源码check out下来即可。在这种情况下，我们博客配置文件的一些敏感信息，例如第三方插件需要的token，都会明码提交到公共仓库上，有一定的安全风险；
2、在做百度SEO的过程中，最有效的链接提交方式是主动提交，虽然Hexo有相关的插件，但是因为插件是注册到Hexo中的，耦合太重，使用不太灵活。
3、一些个性化的需求，例如本博客同时部署在了七牛云，有时候想看一下代码有没有正确同步，需要查看本地的文件数量和大小与七牛云上的是否相同。

## 解决
作为程序猿，问题有了，剩下的就是写代码解决了。由于Hexo是nodejs实现的，所以使用nodejs来解决这些问题应该是最符合的，可是nodejs并不在本人的技术栈中（- -）。人生苦短，我用Ptyhon，那么就使用简单的脚本语言Python来解决吧。

--- talk is cheap show me the code ---

### 配置文件加解密
这里使用rc4加密算法。
``` python
def rc4(p_key, key_len, pin, d_len):
    n = 65536
    s = list(range(n))
    j = 0
    for i in range(n):
        j = (j + s[i] + p_key[i % key_len]) % n  # type: int
        temp = s[i]
        s[i] = s[j]
        s[j] = temp
    i = j = 0
    out = b''
    for x in range(d_len):
        i = i + 1
        j = (j + s[i]) % n  # type: int
        temp = s[i]
        s[i] = s[j]
        s[j] = temp
        out += struct.pack('H', pin[x] ^ s[(s[i] + s[j]) % n])
    return out
    
def coding(data):
    if len(data) % 2:
        data += b'\0'
    d_len = len(data) // 2
    return struct.unpack(str(d_len) + 'H', data)


def un_coding(data):
    d = b''
    for i in range(len(data)):
        d += struct.pack('H', data[i])
    return d


def create_key(_key):
    pl = len(_key)
    key = b''
    r = 0
    for i in range(32):
        k = (_key[r % pl] + i) % 256
        key += struct.pack('B', k)
        r += 1
    return key


def update_key(_key):
    key = un_coding(_key)
    # 循环左移
    key = key[1:] + struct.pack('B', key[0])
    tem = 0
    # 求和
    for i in range(len(key)):
        tem += key[i]
    key_o = b''
    # Xor
    for i in range(len(key)):
        key_o += struct.pack('B', (key[i] ^ tem) % 256)
        tem += key_o[i] >> 3
        tem = tem % 256
    return coding(key_o)
```

有了加密算法，接下来就是对文件的内容进行加解密，首先需要定义一个公共的密码用于生成密钥：
``` python
cipher = "随便写"
```

下面的方法使用到`colorama`，为了在控制台输出颜色，可以自己取舍是否需要。
加密文件：
``` python
def encrypt_file(file):
    a = file
    fin = open(a, 'rb')
    fout = open(a + "-encrypt", 'wb')
    shutil.copy(a, a + ".bak")
    key = coding(create_key(cipher.encode()))
    key = update_key(key)
    fin.seek(0, 2)
    filelen = fin.tell()
    print(Fore.GREEN + 'encrypt ' + file + ', length: ' + str(filelen) + '\n......')
    fin.seek(0, 0)
    fout.write(struct.pack('I', filelen))
    while 1:
        dd = fin.read(65534)
        if not dd:
            break
        srl = len(dd)
        if srl % 2:
            srl += 1
            dd += b'\0'
        crc = struct.pack('I', binascii.crc32(dd))
        dd = coding(dd)
        x = rc4(key, len(key), dd, len(dd))
        key = update_key(key)
        fout.write(struct.pack('H', srl))
        fout.write(x)
        fout.write(crc)
    fin.close()
    fout.close()
    shutil.copy(a + "-encrypt", a)
    os.remove(a + "-encrypt")
    print(Fore.GREEN + 'OK!\n')
```

解密文件：
``` python
def decrypt_file(file):
    a = file
    fin = open(a, 'rb')
    fout = open(a + "-decrypt", 'wb')
    key = coding(create_key(cipher.encode()))
    key = update_key(key)
    filelen = struct.unpack('I', fin.read(4))[0]
    print(Fore.GREEN + 'decrypt ' + file + ', length: ' + str(filelen) + '\n......')
    while 1:
        ps = fin.read(2)
        if not ps:
            break
        packsize = struct.unpack('H', ps)[0]
        dd = fin.read(packsize)
        dd = coding(dd)
        x = rc4(key, len(key), dd, len(dd))
        key = update_key(key)
        crc = struct.unpack('I', fin.read(4))[0]
        if binascii.crc32(x) != crc:
            print('CRC32校验错误！', crc, binascii.crc32(x))
            sys.exit()
        fout.write(x)
    fout.truncate(filelen)
    fin.close()
    fout.close()
    shutil.copy(a + "-decrypt", a)
    os.remove(a + "-decrypt")
    print(Fore.GREEN + 'OK!\n')
```

### 主动推送百度链接
需要用到的变量：
``` python
# 文章路径
posts = "source" + os.path.sep + "_posts"
# 百度中注册的域名
host = "http://www.ciphermagic.cn/"
# 百度主动推送接口url
baidu_url = "http://data.zz.baidu.com/urls?site=你的域名&token=你的token"
```

原理是获取文章的路径，拼接成url，这里要根据自己的博客配置作相应的修改：
``` python
def submit_baidu_all():
    urls = ""
    for file in os.listdir(posts):
		# 本博客的文章地址是：域名 + 文章名 + html后缀
        url = host + os.path.split(file)[-1][:-3] + ".html"
        urls += url + "\n"
    print(urls)
    r = requests.post(baidu_url, data=urls)
    print(r.text)
```
这里是推送所有的文章，在最后的完整代码中会有推送指定文章的方法，因为需要接收命令行的参数，在最后一起展示，便于阅读。

### 查看文件数量和大小
``` python
# 获取文件夹大小
def get_file_size(path):
    if not os.path.exists(path) or not os.path.isdir(path):
        print(path + " is not existed or is not folder")
        sys.exit()
    total_size = 0
    total = 0
    try:
        filename = os.walk(path)
        for root, dirs, files in filename:
            for fle in files:
                current_path = os.path.join(root, fle)
                size = os.path.getsize(current_path)
                total_size += size
                total = total + 1
        print(Fore.GREEN + "total files: %d" % total)
        print(Fore.GREEN + "total size: " + format_size(total_size))
    except Exception as err:
        print(err)


# 字节bytes转化kb\m\g
def format_size(_bytes):
    try:
        _bytes = float(_bytes)
        kb = _bytes / 1024
    except Exception as err:
        return err
    if kb >= 1024:
        m = kb / 1024
        if m >= 1024:
            g = m / 1024
            return "%.2fG" % g
        else:
            return "%.2fM" % m
    else:
        return "%.2fkb" % kb
```

## 完整代码
我们在写博客的时候，通常都是通过Hexo的命令来做一系列的操作，为了保持体验的一致性，我们的python助手也使用命令行操作。操作方式是：
``` shell
python hexo-helper.py -c <command> -p <path> [-d]
```
- -c 操作命令，例如加密、解密、推送链接、查看文件夹
- -p 指定文件路径，需要加解密的文件、需要推送链接的文件、需要查看大小的文件夹
- -d 以默认方式执行，加解密默认操作的文件是网站配置和主题配置文件，链接推送默认是推送所有，查看文件默认是`public`文件夹

完整代码：
``` python
import sys
import getopt
import struct
import os
import binascii
import shutil
import requests
from colorama import init, Fore

# 提示信息
help_msg = "Usage:hexo.py -c <command> -p <path> [-d]"
# 密码
cipher = "你的加密密码"
# 网站配置文件
config = "_config.yml"
# 主题配置文件
theme_config = "themes" + os.path.sep + "next_my" + os.path.sep + "_config.yml"
# 文章路径
posts = "source" + os.path.sep + "_posts"
# 域名
host = "http://www.ciphermagic.cn/"
# 百度主动推送接口url
baidu_url = "http://data.zz.baidu.com/urls?site=你的域名&token=你的token"


def get_file_num_size(options):
    for o, a in options:
        if o in "-p":
            get_file_size(a)
        elif o in "-d":
            # 默认获取public文件夹
            get_file_size("public")


# 获取文件夹大小
def get_file_size(path):
    if not os.path.exists(path) or not os.path.isdir(path):
        print(path + " is not existed or is not folder")
        sys.exit()
    total_size = 0
    total = 0
    try:
        filename = os.walk(path)
        for root, dirs, files in filename:
            for fle in files:
                current_path = os.path.join(root, fle)
                size = os.path.getsize(current_path)
                total_size += size
                total = total + 1
        print(Fore.GREEN + "total files: %d" % total)
        print(Fore.GREEN + "total size: " + format_size(total_size))
    except Exception as err:
        print(err)


# 字节bytes转化kb\m\g
def format_size(_bytes):
    try:
        _bytes = float(_bytes)
        kb = _bytes / 1024
    except Exception as err:
        return err
    if kb >= 1024:
        m = kb / 1024
        if m >= 1024:
            g = m / 1024
            return "%.2fG" % g
        else:
            return "%.2fM" % m
    else:
        return "%.2fkb" % kb


def submit_baidu(options):
    for o, a in options:
        if o in "-p":
            url = host + os.path.split(a)[-1][:-3] + ".html"
            print(url)
            r = requests.post(baidu_url, data=url)
            print(r.text)
        elif o in "-d":
            # 默认推送所有链接
            submit_baidu_all()


def submit_baidu_all():
    urls = ""
    for file in os.listdir(posts):
        url = host + os.path.split(file)[-1][:-3] + ".html"
        urls += url + "\n"
    print(urls)
    r = requests.post(baidu_url, data=urls)
    print(r.text)


def encrypt(options):
    for o, a in options:
        if o in "-p":
            encrypt_file(a)
        elif o in "-d":
            # 默认加密网站配置文件和主题配置文件
            encrypt_file(config)
            encrypt_file(theme_config)


def decrypt(options):
    for o, a in options:
        if o in "-p":
            decrypt_file(a)
        elif o in "-d":
            # 默认解密网站配置文件和主题配置文件
            decrypt_file(config)
            decrypt_file(theme_config)


def decrypt_file(file):
    a = file
    fin = open(a, 'rb')
    fout = open(a + "-decrypt", 'wb')
    key = coding(create_key(cipher.encode()))
    key = update_key(key)
    filelen = struct.unpack('I', fin.read(4))[0]
    print(Fore.GREEN + 'decrypt ' + file + ', length: ' + str(filelen) + '\n......')
    while 1:
        ps = fin.read(2)
        if not ps:
            break
        packsize = struct.unpack('H', ps)[0]
        dd = fin.read(packsize)
        dd = coding(dd)
        x = rc4(key, len(key), dd, len(dd))
        key = update_key(key)
        crc = struct.unpack('I', fin.read(4))[0]
        if binascii.crc32(x) != crc:
            print('CRC32校验错误！', crc, binascii.crc32(x))
            sys.exit()
        fout.write(x)
    fout.truncate(filelen)
    fin.close()
    fout.close()
    shutil.copy(a + "-decrypt", a)
    os.remove(a + "-decrypt")
    print(Fore.GREEN + 'OK!\n')


def encrypt_file(file):
    a = file
    fin = open(a, 'rb')
    fout = open(a + "-encrypt", 'wb')
    shutil.copy(a, a + ".bak")
    key = coding(create_key(cipher.encode()))
    key = update_key(key)
    fin.seek(0, 2)
    filelen = fin.tell()
    print(Fore.GREEN + 'encrypt ' + file + ', length: ' + str(filelen) + '\n......')
    fin.seek(0, 0)
    fout.write(struct.pack('I', filelen))
    while 1:
        dd = fin.read(65534)
        if not dd:
            break
        srl = len(dd)
        if srl % 2:
            srl += 1
            dd += b'\0'
        crc = struct.pack('I', binascii.crc32(dd))
        dd = coding(dd)
        x = rc4(key, len(key), dd, len(dd))
        key = update_key(key)
        fout.write(struct.pack('H', srl))
        fout.write(x)
        fout.write(crc)
    fin.close()
    fout.close()
    shutil.copy(a + "-encrypt", a)
    os.remove(a + "-encrypt")
    print(Fore.GREEN + 'OK!\n')


def rc4(p_key, key_len, pin, d_len):
    n = 65536
    s = list(range(n))
    j = 0
    for i in range(n):
        j = (j + s[i] + p_key[i % key_len]) % n  # type: int
        temp = s[i]
        s[i] = s[j]
        s[j] = temp
    i = j = 0
    out = b''
    for x in range(d_len):
        i = i + 1
        j = (j + s[i]) % n  # type: int
        temp = s[i]
        s[i] = s[j]
        s[j] = temp
        out += struct.pack('H', pin[x] ^ s[(s[i] + s[j]) % n])
    return out


def coding(data):
    if len(data) % 2:
        data += b'\0'
    d_len = len(data) // 2
    return struct.unpack(str(d_len) + 'H', data)


def un_coding(data):
    d = b''
    for i in range(len(data)):
        d += struct.pack('H', data[i])
    return d


def create_key(_key):
    pl = len(_key)
    key = b''
    r = 0
    for i in range(32):
        k = (_key[r % pl] + i) % 256
        key += struct.pack('B', k)
        r += 1
    return key


def update_key(_key):
    key = un_coding(_key)
    # 循环左移
    key = key[1:] + struct.pack('B', key[0])
    tem = 0
    # 求和
    for i in range(len(key)):
        tem += key[i]
    key_o = b''
    # Xor
    for i in range(len(key)):
        key_o += struct.pack('B', (key[i] ^ tem) % 256)
        tem += key_o[i] >> 3
        tem = tem % 256
    return coding(key_o)


if __name__ == "__main__":
    init(autoreset=True)
    try:
        opts, args = getopt.getopt(sys.argv[1:], "c:p:d")
    except getopt.GetoptError:
        print(help_msg)
        sys.exit()
    if len(opts) == 0:
        print(help_msg)
        sys.exit()
    for opt, arg in opts:
        if opt in "-c":
            if arg == "en":
                encrypt(opts)
            elif arg == "de":
                decrypt(opts)
            elif arg == "baidu":
                submit_baidu(opts)
            elif arg == "file":
                get_file_num_size(opts)
            else:
                print(help_msg)
                sys.exit()
```

文件保存为hexo-helper.py，放到博客的根目录下，使用方法：

- 加密配置文件   `python hexo-helper.py -c en -d`
- 解密配置文件   `python hexo-helper.py -c de -d`
- 推送百度链接 	 `python hexo-helper.py -c baidu -d`
- 查看文件夹大小 `python hexo-helper.py -c file -d`

## 最后
python作为解析型语言，语法简洁，第三方包丰富，可以快速的满足我们的需求。日后再有新的需求，只需要再添加新的操作符和新的方法即可。最后的最后，本人接触python的时间不是很长，代码写的很丑，如有错误，请不吝指正。