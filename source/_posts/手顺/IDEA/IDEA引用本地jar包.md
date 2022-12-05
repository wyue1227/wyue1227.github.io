---
title: IDEA引用本地jar包/maven引用本地jar包
date: 2020-11-09 17:38:40
tags: IDEA
categories: [手顺]
excerpt: 项目是maven项目，但是部分jar包需要本地引用。
toc: true
typora-root-url: ../../source
---
## 解决方案一 直接引用本地jar包

File -> Project Structure -> Moudle ->Dependencies -> 右边的 + 

![](/images/IDEA爬坑小记/2022-12-05-15-43-01.png)

## 解决方案二 maven的pom文件中直接引用本地jar包

### 项目根目录创建lib文件夹，将jar包拖入

### 在Maven pom.xm文件中按如下方式引入本地jar包

scope设为system，表示不从仓库中搜索jar包。
systemPath设为对应路径+jar包名称。

![](/images/IDEA爬坑小记/2022-12-05-15-45-05.png)

### reimport & build

右键pom.xml -> Maven -> Reimport

![](/images/IDEA爬坑小记/2022-12-05-15-45-25.png)

build -> Rebuild Project