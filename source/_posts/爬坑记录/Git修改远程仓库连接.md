---
title: Git修改远程仓库连接
toc: true
date: 2022-12-11 17:44:04
updated: 2022-12-11 17:44:04
tags: git
categories: 爬坑记录
---

## 背景

github desktop没找到强制push的功能，所以用命令行来解决问题。但是用命令的时候发现remote是http而不是ssh，push失败并报错：

```text
remote: Support for password authentication was removed on August 13, 2021.
remote: Please see https://docs.github.com/en/get-started/getting-started-with-git/about-remote-repositories#cloning-with-https-urls for information on currently recommended modes of authentication.
fatal: Authentication failed for 'https://github.com/wyue1227/wyue1227.github.io.git/'
```

## 解决方法

```shell
# 初次查看
git remote -v;

# 设置remote为ssh
git remote set-url origin git@github.com:wyue1227/wyue1227.github.io.git

# 确认
git remote -v; 
```