---
title: TortoiseGit合并commit
date: 2023-03-01 20:54:28
updated: 2023-03-01 20:54:28
tags: [Git, TortoiseGit]
categories: 手顺
excerpt: TortoiseGit -> Combine to one commit
---
### 1 查看log

![](images/TortoiseGit合并commit/2023-03-01-20-57-19.png)

### 2 选择合并的commit -> 右键 -> Combine to one commit

注：合并的commit必须是连续的，中间不能有中断。

![](images/TortoiseGit合并commit/2023-03-01-20-58-09.png)

### 3 更正修改后的commit履历 -> commit

![](images/TortoiseGit合并commit/2023-03-01-20-58-36.png)

### 4 push

注：如果更改的commit已经被push，需要勾选known changes（如下图）。如果只是本地commit则不需要勾选。

![](images/TortoiseGit合并commit/2023-03-01-20-59-18.png)

### 5 查看结果

#### 5.1 本地log

![](images/TortoiseGit合并commit/2023-03-01-20-59-51.png)

#### 5.2 GitHub commit履历

![](images/TortoiseGit合并commit/2023-03-01-21-00-04.png)