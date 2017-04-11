---
title: Maven初探
categories: blog
tags: [maven] 
---
最近刚接触了Maven，就根据自己的理解介绍一下Maven在开发中怎么用，顺便巩固一下知识。
## Maven是什么
我目前使用Maven主要是管理项目中jar包，其它高级的用法暂时还没涉及到。我们为什么要用Maven帮我们管理jar包呢，一个是我们不需要自己再到各个第三方框架或技术的网站上下载jar包了，另外一个是很好的统一了项目中各jar包的版本，因为多人开发中使用不同版本的jar包可能会有版本的冲突问题。Maven提供一个中央仓库，里面有几乎所有主流技术的jar包，我们只需要在配置文件中指定好要使用的jar，Maven就会帮我们自动下载。Maven会在本地建一个仓库，第一次下载的jar包放在本地仓库里，Maven根据配置注入jar的时候先从本地仓库里查找，如果没有再从远程中央仓库里下载，提高了效率。
## 如何安装和配置Maven
安装Maven跟安装Jdk差不多，我们只需要把Maven下载下来，在环境变量中新建一个变量``` %MAVEN_HOME%```，再在```path```中加上```%MAVEN_HOME%/bin```，如此，我们就能在控制台中使用Maven的命令了，我们可以在控制台输入```mvn -v```，如果成功输入Maven的版本信息，就说明Maven已经能正常工作了。但是，在使用之前我们做一些简单的修改来更好的使用Maven。
### 一些必要的修改
首先，在Maven根目录下进入```conf```文件夹找到```settings.xml```配置文件，它可以配置Maven各种信息。在文件里面找到```<localRepository>/path/to/local/repo</localRepository>```，这一行是配置Maven本地仓库的路径，把标签中的路径换成自己指定的路径例如```E:\apache-maven-3.2.3-bin\Repository```，要在对应的地方把这个文件夹新建好，这样Maven下载下来的jar包就会存到这个文件夹中。注意这一行在文件中是注释掉的，要把注释打开。接着，在配置文件中找到```<proxies>```标签，这里是设置Maven的镜像，如果我们有自己局域网内的中央仓库，可以在这里设置，这样Maven就会从我们局域网中的仓库下载，速度就会快很多。在日常开发中主要是设置这两个地方。
## 在Eclipse中集成Maven
### 安装Maven插件
我使用的是Eclipse版本是**kepler**，首先要安装Maven插件，在菜单栏中选择```Help——Install New Software…```接着你会看到一个Install对话框，点击Work with:字段边上的**Add**按钮，你会得到一个新的Add Repository对话框，在**Name**字段中输入```m2e```，**Location**字段中输入在线安装地址，这里提供一个[地址](http://download.eclipse.org/technology/m2e/releases/)，如果失效了可以在网上再找。然后点击OK。Eclipse会下载m2eclipse安装站点上的资源信息。
### 加入本地Maven
依次选择菜单```Windows——Preferences——Maven——Installations```，然后在界面中点击```Add```，选择本地Maven的根目录，这样我们就设置好Maven插件了。
## Eclipse创建Maven项目
新建项目选择```Maven Project```，勾选```Use default Workspace location```使用默认的Workspace路径，点```Next```，一般的Web项目我们选择webapp
![](http://ww3.sinaimg.cn/large/698f7fe7gw1elwuvq2saxj20i20ga43m.jpg)
点```Next```，输入工程信息， ```Group Id```类似一个包名，```Artifact Id```类似类名。其它默认即可。
![](http://ww4.sinaimg.cn/large/698f7fe7gw1elwv0l1a2kj20i20gadii.jpg)
点```Finish```就完成创建了。完成后我们能在项目中找到一个```pom.xml```文件，里面就可以配置我们项目中所需的依赖jar包了。
## 最后
以上就是我最近初学Maven的一点认识，Maven确实是一个很好的构建工具，而也不仅仅是一个构建工具。更深的了解还要在以后的学习当中去探索。
-END-