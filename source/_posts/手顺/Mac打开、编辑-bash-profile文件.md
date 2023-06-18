---
title: Mac打开、编辑.bash_profile文件
toc: true
date: 2019-04-07 21:27:17
updated: 2019-04-07 21:27:17
tags: [Mac]
categories: 手顺
excerpt: 文件的路径是`/Users/{YourMacUserName}/.bash_profile`
--- 
一般在Mac上配置环境变量时经常要创建、编辑`.bash_profile`文件。

创建该文件时一般都会选择在当前用户目录下，即Mac下的`.bash_profile`文件的路径是`/Users/{YourMacUserName}/.bash_profile` (如果该文件已经创建过的话)

![](images/Mac打开、编辑-bash-profile文件/image-20221228170332852.png)

### 1 创建 .bash_profile

（1） 启动终端
（2） 进入当前用户的home目录(默认就是)： 
 `cd ~` 或 `cd /Users/{YourMacUserName}`
（3）输入`touch .bash_profile`

### 2 查看、编辑 .bash_profile 文件

（1）终端输入 `open -e .bash_profile `
（如果只是查看，直接使用open .bash_profile）
（2）编辑
（3）关闭即可保存修改

  
### 3 更新刚配置的环境变量
 输入 `source .bash_profile`