---
title: Dubbo服务提供者使用ProGuard实现代码混淆
date: 2017-04-11 21:23:24
categories: 技术
tags: [dubbo,proguard] 
---

ProGuard能够作为maven的插件使用，让我们在原来的项目结构中，能够方便的实现代码混淆。但是网上ProGuard的资料通常都是单应用的实现，因此本文基于dubbo分布式项目，简单描述一下如何实现服务提供者的代码混淆。

<!-- more -->

## 服务提供者代码混淆
项目作为dubbo服务提供者，以jar的方式发布服务。

### pom中添加ProGuard插件

``` xml
            <!-- ProGuard混淆插件-->
            <plugin>
                <groupId>com.github.wvengen</groupId>
                <artifactId>proguard-maven-plugin</artifactId>
                <version>2.0.11</version>
                <executions>
                    <execution>
                        <!-- 打包的时候混淆-->
                        <phase>package</phase>
                        <goals>
                            <!-- 使用混淆功能-->
                            <goal>proguard</goal>
                        </goals>
                    </execution>
                </executions>
                <configuration>
                    <!-- 是否将生成的PG文件安装部署-->
                    <attach>true</attach>
                    <!-- 是否混淆-->
                    <obfuscate>true</obfuscate>
                    <!-- 指定生成文件分类 -->
                    <attachArtifactClassifier>pg</attachArtifactClassifier>
                    <!-- 指定配置文件的路径，不在pom文件中配置，放在配置文件中方便管理 -->
                    <proguardInclude>${basedir}/proguard.conf</proguardInclude>
                    <!-- 添加依赖，添加jdk的依赖即可 -->
                    <libs>
                        <lib>${java.home}/lib/rt.jar</lib>
                        <lib>${java.home}/lib/jce.jar</lib>
                    </libs>
                </configuration>
            </plugin>
```

### pom同级目录下添加proguard.conf混淆配置文件
``` java
# ----------------------------------
# JDK目标版本
# ----------------------------------
-target 1.7

# ----------------------------------
# 忽略所有告警
# ----------------------------------
-ignorewarnings

# ----------------------------------
# 混淆时应用侵入式重载
# ----------------------------------
-overloadaggressively

# ----------------------------------
# 优化时允许访问并修改有修饰符的类和类的成员
# ----------------------------------
-allowaccessmodification

# ----------------------------------
#确定统一的混淆类的成员名称来增加混淆
# ----------------------------------
-useuniqueclassmembernames

# ----------------------------------
# 不略过非公用类文件及成员
# ----------------------------------
-dontskipnonpubliclibraryclasses
-dontskipnonpubliclibraryclassmembers

# ----------------------------------
# 不输出通知
# ----------------------------------
-dontnote

# ----------------------------------
# 不混淆所有包名，Spring配置中有大量固定写法的包名
# ----------------------------------
-keeppackagenames

# ----------------------------------
# 不混淆所有特殊的类
# ----------------------------------
-keepattributes SourceFile,Exceptions,InnerClasses,*Annotation*,Signature,LineNumberTable

# ----------------------------------
# 不混淆对外服务的类
# 实体类、dao、service、枚举类：不混淆类名和属性、方法
# 实现类：不混淆类名
# ----------------------------------
-keep class xxx.dao.** {*;}
-keep class xxx.domain.** {*;}
-keep class xxx.enums.** {*;}
-keep class xxx.service.** {*;}
-keep class xxx.impl.**

# ----------------------------------
# 不混淆spring配置文件中定义的类
# ----------------------------------
按照项目配置
```

### 打包，并替换class文件
经过以上配置后，执行maven打包命令`mvn package`，在项目的target文件夹中会得到两个jar：项目名.jar、项目名-pg.jar。
然后我们要将这两个解压：
``` shell
PROJ=项目名
PROJPG=${PROJ}"-pg"

unzip $PROJ.jar 
unzip $PROJPG.jar
```
并将“项目名-pg”文件夹中的cn目录拷贝到原项目中，然后把它打成jar包：
``` shell
rm -rf $PROJ/cn/
cp -avpf $PROJPG/cn/ $PROJ/
jar cvfm $PROJPG.jar $PROJ/META-INF/MANIFEST.MF -C $PROJ/ .
```
此时得到的“项目名.jar”就是混淆后的可执行jar包。执行它即可发布服务到dubbo注册中心。
以上操作可写成shell脚本，添加到自动部署流程中，实现自动化管理。

* 本文的配置请参照自身的项目做相应的调整