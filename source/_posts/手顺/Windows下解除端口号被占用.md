---
title: Windows下解除端口号被占用
date: 2021-05-19 15:47:11
tags: Windows
categories: 手顺
toc: true
typora-root-url: ../../source
---
## 问题背景

运行web项目的时候，忘记关闭上一个项目，然后直接运行下一个项目。上一个项目仍在运行中，端口号被占用。

## 解决方法

直接在CMD中找到被占用端口号的进程id，结束进程运行。

1. window+R 输入cmd
2. netstat -ano | findstr 端口号
3. taskkill /f /pid 进程id

## 截图

![](/images/Windows下解除端口号被占用/2022-12-05-15-26-56.png)