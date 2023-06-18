---
title: TortoiseGit设置开机自启动，并自动加载SSH-KEY
toc: true
date: 2020-11-08 22:17:03
updated: 2020-11-08 22:17:03
tags: [TortoiseGit]
categories: 手顺
excerpt: TortoiseGit无法使用git生成的ssh-key，需要转化为ppk 公钥。所以每次提交代码钱要打开 Pageant ，然后去加载公钥，非常麻烦。
---
#TortoiseGit 

### 问题描述：

TortoiseGit无法使用git生成的ssh-key，需要转化为ppk 公钥。所以每次提交代码钱要打开 Pageant ，然后去加载公钥，非常麻烦。

### 解决方法：

#### 1. 打开Pagement的快捷方式图标

开始 -> TortoiseGit -> Pagement -> 更多 -> 打开文件位置

![](images/TortoiseGit设置开机自启动，并自动加载SSH-KEY/2023-06-18-21-50-15.png)

#### 2. 打开开机自启动文件夹

win + R -> 输入 shell:startup -> 确定

![](images/TortoiseGit设置开机自启动，并自动加载SSH-KEY/2023-06-18-21-50-34.png)

#### 3. 将Pagement图标拖至自启动文件夹

![](images/TortoiseGit设置开机自启动，并自动加载SSH-KEY/2023-06-18-21-50-58.png)

#### 4. 拼接ppk路径

右键图标 -> 属性 -> 快捷方式 -> 目标

在后面加上privatekey.ppk的路径，记得与前面加一个空格。

![](images/TortoiseGit设置开机自启动，并自动加载SSH-KEY/2023-06-18-21-51-10.png)
