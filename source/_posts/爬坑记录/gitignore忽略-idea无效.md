---
title: gitignore忽略.idea无效
toc: true
date: 2021-07-08 00:08:53
tags: [Git, IDEA]
categories: 爬坑记录
---
## 发生原因

idea创建工程时已经将它存储进暂存区。

## 解决方法

利用 `git rm --cached` 从索引中删除.idea文件。

![](/images/gitignore忽略.idea无效/2022-12-05-15-39-35.png)