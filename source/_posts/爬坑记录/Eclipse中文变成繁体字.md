---
title: Eclipse中，中文变成繁体字
date: 2023-02-05 22:32:24
updated: 2023-02-05 22:32:24
tags: Eclipse
categories: 爬坑记录
excerpt: Eclipse中，格式化代码 Ctrl + Shift + F，同时是搜狗的简繁体转换快捷键。
toc: true
---

## 问题描述：

在Eclipse中打字，突然注释代码只能打出来繁体字。

## 截图：

![](images/Eclipse中，中文变成繁体字/2023-02-05-22-37-30.png)

## 问题出现的原因

Eclipse中，格式化代码 Ctrl + Shift + F，同时是搜狗的简繁体转换快捷键。

## 解决方案

再按一次格式化代码（Ctrl + Shift + F），然后去搜狗里将简繁体转换快捷键更换。

## 关闭搜狗简繁体转换方案

### 1. 右键输入法 -> 属性设置

![](images/Eclipse中，中文变成繁体字/2023-02-05-22-37-39.png)

### 2. 高级 -> 系统功能快捷键

![](images/Eclipse中，中文变成繁体字/2023-02-05-22-37-50.png)

### 3. 关闭简繁切换

![](images/Eclipse中，中文变成繁体字/2023-02-05-22-37-55.png)

## 关联问题

{% post_link 爬坑记录/Eclipse格式化代码失效 %}