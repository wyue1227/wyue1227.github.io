---
title: IDEA常用操作记录
date: 2020-11-09 17:15:21
tags: IDEA
categories: 手顺
toc: true
typora-root-url: ../../source
---
## IDEA文件重命名

右键想要重命名的类 -> Refactor -> rename
或者直接点击类 -> Shift + F6


## IDEA创建properties文件

在创建路径右键 -> New -> Resource Bundle -> 添加名字

![](/images/IDEA爬坑小记/2022-12-05-15-37-50.png)

![](/images/IDEA爬坑小记/2022-12-05-15-38-00.png)


## IDEA更改Jacoco Coverage样式(默认的Coverage只显示最左边一点，期望改成Eclipse那种整条显示。)

1. Settings -> Editor -> Color Scheme -> General -> Line Coverage
2. 将每个Foreground改成黑色 #000000
3. Backgroud分别改成绿黄红 -> 对应Full/Partial/Uncovered

![](/images/IDEA爬坑小记/2022-12-05-15-46-29.png)