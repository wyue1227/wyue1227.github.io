---
title: git stash误删除后找回
toc: true
date: 2023-02-05 12:49:38
updated: 2023-02-05 12:49:38
tags: Git
categories: 
- 编程入门
---

### 背景

stash list在脑子不清醒的时候误删除了，要找回内容。

### 解决步骤

#### 1 `git fsck –lost-found`
（列出删除的commit）

![](/images/GitStash误删除后找回/image-20230110194243929.png)

#### 2 `git show` + `<sha>`

逐个commit查看，直到找到误删的commit。

#### 3 `git merge` + `<sha>`

找回误删除的代码。

#### 4 `git reset`

如果不打算提交，还原索引至上一版本。