---
title: 执行yum提示错误 thread died in berkeley db library
toc: true
date: 2022-12-28 17:27:49
updated: 2022-12-28 17:27:49
tags: [Linux]
categories: 爬坑记录
---
### 问题描述

在执行yum安装或者其他命令时，有如下提示：

![](images/执行yum提示错误thread-died-in-berkeley-db-library/image-20221228174755686.png)

### 解决方法

```shell
[root@VM-0-14-centos /]# cd /var/lib/rpm
[root@VM-0-14-centos rpm]# ls
Basenames     __db.001  __db.003  Group       Name          Packages     Requirename  Sigmd5
Conflictname  __db.002  Dirnames  Installtid  Obsoletename  Providename  Sha1header   Triggername
[root@VM-0-14-centos rpm]# rm -rf __db*
[root@VM-0-14-centos rpm]# rpm --rebuilddb
```