---
title: TortoiseGit中known changes与unknown changes区别
toc: true
date: 2023-03-01 21:03:34
updated: 2023-03-01 21:03:34
tags: [TortoiseGit]
categories: 开发总结
---
### 示意图

![](images/TortoiseGit中known-changes与unknown-changes区别/2023-03-01-21-04-31.png)

### 官方介绍

known changes - This allows remote repository to accept a safer non-fast-forward push. This can cause the remote repository to lose commits; use it with care. This can prevent from losing unknown changes from other people on the remote. It checks if the server branch points to the same commit as the remote-tracking branch (known changes). If yes, a force push will be performed. Otherwise it will be rejected. Since git does not have remote-tracking tags, tags cannot be overwritten using this option. This passes --force-with-lease option of git push command. 

unknown changes - This allows remote repository to accept an unsafe non-fast-forward push. This can cause the remote repository to lose commits; use it with care. This does not check any server commits, so it is possible to lose unknown changes on the remote. Use this option with Include Tags to overwrite tags. This passes the traditional --force option of git push command.

### 简单理解

unknown changes 等价于`--force`，强行提交时，可能覆盖团队成员在此期间推送的所有更改。

known changes 等价于`--force-with-lease`，使用此参数推送，如果远端有其他人推送了新的提交，那么推送将被拒绝。该命令解决的是本地仓库不够新时，依然覆盖了远端新仓库的问题，如果执意想要覆盖远端提交，只需要先 fetch 再push，它也不会拒绝的。