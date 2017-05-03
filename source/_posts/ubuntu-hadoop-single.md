---
title: Ubuntu 16.04单机模式安装Hadoop 2.6.0
date: 2017-05-03 14:16
categories: 技术
tags: [hadoop] 
---

### 前言
Hadoop是一个分布式计算框架，整套部署起来并非那么简单。但是Hadoop提供单机模式的安装，适合新手尝个鲜，感性的体验一下Hadoop究竟是什么。纸上得来终觉浅，动手实践才是唯一真理。

### 环境说明
本文系统是ubuntu-16.04.1-server-amd64，安装在Win10自带的虚拟机管理系统Hyper-V之上。为了提高下载速度，apt-get源换成了阿里的源。由于是虚拟机，为了方便，以下所有的操作都是在root账号下操作。

### 安装JDK
Hadoop依赖jdk环境，所以必须先安装jdk，本文以jdk8为例：
``` bash
apt-get install openjdk-8-jdk
```
等下载安装Hadoop后统一修改环境变量。

### 安装Hadoop2.6.0
下载：
``` bash
wget http://archive.apache.org/dist/hadoop/core/hadoop-2.6.0/hadoop-2.6.0.tar.gz
```
解压并拷贝到`usr/local`目录下：
``` bash
tar zxvf hadoop-2.6.0.tar.gz
mv hadoop-2.6.0 /usr/local/hadoop
```

### 修改环境变量
打开`/root/.bashrc`：
``` bash
vim /root/.bashrc
```
在文件末尾添加：
``` bash
export JAVA_HOME=/usr/lib/jvm/java-8-openjdk-amd64
export HADOOP_INSTALL=/usr/local/hadoop
export PATH=$PATH:$HADOOP_INSTALL/bin
export PATH=$PATH:$HADOOP_INSTALL/sbin
export HADOOP_MAPRED_HOME=$HADOOP_INSTALL
export HADOOP_COMMON_HOME=$HADOOP_INSTALL
export HADOOP_HDFS_HOME=$HADOOP_INSTALL
export YARN_HOME=$HADOOP_INSTALL
export HADOOP_COMMON_LIB_NATIVE_DIR=$HADOOP_INSTALL/lib/native
export HADOOP_OPTS="-Djava.library.path=$HADOOP_INSTALL/lib"
```
保存退出，激活环境变量：
``` bash
source /root/.bashrc
```
测试是否成功：
依次执行`java -version`，`hadoop version`。如果没有报错，则表示安装成功。

### 使用Hadoop
这里使用Hadoop提供的例子，计算文本的单词数量，以`/var/log/dpkg.log`为例。
首先到hadoop目录下（`/usr/local/hadoop`）,复制`dpkg.log`到input目录：
``` bash
cp /var/log/dpkg.log ./input/
```
最重要的一步，执行Hadoop，并指定类文件：
``` bash
bin/hadoop jar share/hadoop/mapreduce/sources/hadoop-mapreduce-examples-2.6.0-sources.jar org.apache.hadoop.examples.WordCount input output
```
可以看到，这里指定了`WordCount`类来统计单词数量，指定`input`为输入文件夹，`output`为输出文件夹。
如果以上命令执行后没有报错，则表示计算成功，可以查看结果：
``` bash
cat output/*
```

### 完结
至此，单机安装Hadoop成功，并且成功运行了一个mapreduce的任务。
ʅ（´◔౪◔）ʃ   沉淀一下吧~
