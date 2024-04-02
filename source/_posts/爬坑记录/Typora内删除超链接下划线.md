---
title: Typora内删除超链接下划线
toc: true
date: 2022-11-29 16:00:01
updated: 2022-11-29 16:00:01
tags: [软件]
categories: 爬坑记录
---

## 背景

用Markdown写个人简历的时候，邮箱会自动转换成超链接的形式。如果邮箱里带下划线会跟超链接的下划线样式冲突。

## 解决方法

### 1. 打开Typora主题配置（偏好->外观）

![](images/Typora内删除超链接下划线/image-20221129203952019.png)

### 2. 打开github.css文件

![](images/Typora内删除超链接下划线/Pasted%20image%2020221129204011.png)

### 3. 查找a标签，添加删除下划线代码

```css
a {
  color: #4183C4;
  text-decoration: none;
}
```

![](images/Typora内删除超链接下划线/Pasted%20image%2020221129204036.png)

### 4. 重新打开Typora

![](images/Typora内删除超链接下划线/Pasted%20image%2020221129204045.png)