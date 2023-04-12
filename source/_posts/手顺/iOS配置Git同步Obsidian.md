---
title: iOS配置Git同步Obsidian
date: 2022-12-01 22:25:02
tags: [iOS, Obsidian, Git]
categories: 手顺
excerpt: 利用Git，实现全平台版本管理与数据同步。
toc: true
---

## 背景

语雀收费之后，知识管理平台的选择又一次成为令我头痛的事。最初的印象笔记、之后的有道云、再然后的语雀。好用的工具层出不穷，但是一旦深入使用后迁移平台却是难上加难。所以我最终选择Obsidian这种全平台、本地、基于Markdown的数据管理工具。

由于使用的Mac+iPhone，所以iCloud与Obsidian搭配其实已经实现了跨平台的数据交互。但是既然已经跨平台了，且本身作为程序员，GIthub与Git才是我最信任的工具。借此也诞生了这篇文章，既如何利用Git，实现全平台版本管理与数据同步。

## 分析

由于iOS端的文件管理与Obsidian的软件特性，Obsidian只能读取自己文件夹下的资料。

具体如图：

![](/images/iOS配置Git同步Obsidian/image-20221201215719189.png)

所以尽管iOS上有很多Git软件，但是如果不能打破文件管理这个层级的问题，Obsidian无法读取到git软件操作的文档仓库。毕竟这不是PC平台，Obsidian可以任意的打开被git管理的指定文件夹。

## 方案

### 方案一 利用working copy将git仓库映射到Obsidian文件夹下

具体操作：[https://zhuanlan.zhihu.com/p/531516583](https://zhuanlan.zhihu.com/p/531516583)

原理很简单，Obsidian既然只能读自己文件夹下的文件，那么利用working copy，将仓库share到Obsidian下的valut即可。

![](/images/iOS配置Git同步Obsidian/image-20221201220723018.png)

这个方法优点是操作简单，所有的git操作完全可以在working copy的GUI下完成。缺点也很明显，working copy买断价128元。

### 方案二 利用ish挂载Obsidian的valut，并生成git仓库

ish是一个基于iOS的shell应用，在程序内可以调用linux命令操作iOS系统。核心操作如标题，将Obsidian的valut文件夹直接挂载到ish文件夹内，然后就可以肆意处理。ish本身是linux环境，自然可以安装git。

![](/images/iOS配置Git同步Obsidian/image-20221201221513197.png)

具体参照：[https://zhuanlan.zhihu.com/p/565028534](https://zhuanlan.zhihu.com/p/565028534)
(不必完全参照知乎回答，有些步骤可以省略，只要考虑核心步骤即可。)

核心步骤：
1. 下载 ish和Obsidian App
2. 在 ish内，下载Git等软件
3. 利用Linux下的`mount`命令挂载Obsidian下的文件夹
4. 依托于Obsidian文件夹，git初始化（因为有.obsidian文件，无法直接clone），并关联远程仓库地址
5. 正常pull / push即可（记得checkout选择分支）

这个方案最大的优点是免费，缺点是必须懂git和linux。因为所有的操作都是通过命令行实施，包括后续的文档内容更新。

## 体验截图

### PC端

#### Git客户端

![](/images/iOS配置Git同步Obsidian/image-20221201221840531.png)

#### PC端Obsidian

![](/images/iOS配置Git同步Obsidian/image-20221201221904640.png)

### 移动端

#### ish管理文档

![image-20221201223413196](/images/iOS%E9%85%8D%E7%BD%AEGit%E5%90%8C%E6%AD%A5Obsidian/image-20221201223413196-9905258.png)

#### 移动端Obsidian

<img src="/images/iOS配置Git同步Obsidian/AF391451-646A-47D5-B78A-38A1500FBC20_1_102_o.jpeg" style="zoom: 33%;" />

<img src="/images/iOS配置Git同步Obsidian/9E2969FD-0E72-441C-8D00-F5719D646630_1_102_o.jpeg" style="zoom:33%;" />
