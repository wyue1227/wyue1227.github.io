---
title: Python报错UnicodeDecodeError
toc: true
date: 2023-02-14 21:11:10
updated: 2023-02-14 21:11:10
tags: [Python]
categories: 爬坑记录
---

## 背景
Python IO读取文件时报错`UnicodeDecodeError: ‘gbk’ codec can’t decode byte...`

## 错误原因
如同报错信息，Unicode解码失败。根本原因是文件中有汉字/日文等其他文字不能用gbk打开。

## 解决方法

利用`utf-8`格式打开

```python
file = open(filename, encoding="utf8")
```