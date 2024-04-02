---
title: TortoiseGit cherry-pick操作手顺
toc: true
date: 2022-11-28 17:47:17
updated: 2022-11-28 17:47:17
tags: [Git, TortoiseGit]
categories: 手顺
---
## 1 cherry-pick说明

cherry-pick指的是某分支提交的commit应用到其他分支。

## 2 场景说明

同时拥有master分支和dev分支，通过cherry-pick将dev分支的commit合并到master。

## 3 操作手顺

### 3.1 前期状态

#### dev分支（较新）

![](images/TortoiseGit%20cherry-pick操作手顺/image-20221229195354599.png)

#### master分支（较旧）

![](images/TortoiseGit%20cherry-pick操作手顺/Pasted%20image%2020221229195416.png)

### 3.2 执行操作

#### 切换到master分支（被追加commit的分支）

![](images/TortoiseGit%20cherry-pick操作手顺/Pasted%20image%2020221229195427.png)

#### 查看log

![](images/TortoiseGit%20cherry-pick操作手顺/Pasted%20image%2020221229195438.png)

#### 切换到dev分支的log（已经commit的分支）

![](images/TortoiseGit%20cherry-pick操作手顺/Pasted%20image%2020221229195449.png)

![](images/TortoiseGit%20cherry-pick操作手顺/Pasted%20image%2020221229195455.png)

![](images/TortoiseGit%20cherry-pick操作手顺/Pasted%20image%2020221229195501.png)

#### 选中要cherry-pick的对象，执行cherry-pick

![](images/TortoiseGit%20cherry-pick操作手顺/Pasted%20image%2020221229195512.png)

![](images/TortoiseGit%20cherry-pick操作手顺/Pasted%20image%2020221229195517.png)

![](images/TortoiseGit%20cherry-pick操作手顺/Pasted%20image%2020221229195523.png)

#### 查看master的log

![](images/TortoiseGit%20cherry-pick操作手顺/Pasted%20image%2020221229195533.png)


#### push到remote即可。