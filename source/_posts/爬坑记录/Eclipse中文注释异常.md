---
title: Eclipse中文注释异常
toc: true
date: 2022-11-29 15:57:53
updated: 2022-11-29 15:57:53
tags: Eclipse
categories: 爬坑记录
---

## 问题描述：

Eclipse中文注释与星号配合的适合显示会异常。

## 出现问题的原因：

Eclipse内置字体对中文支持有限。

## 解决方法：

更改字体为中文字体。(默认系统字体)

```text
Window -> Perferences ->

左侧General -> Appearance -> Colors and Fonts ->

右侧Basic -> Text Font -> Use System Font
```

### 推荐字体：

Courier New

![](images/Eclipse中文注释异常/2024-04-02-15-59-19.png)