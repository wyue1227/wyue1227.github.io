---
title: PostgreSQL入门
date: 2023-03-06 20:37:27
updated: 2023-03-06 20:37:27
tags: PostgreSQL
categories: 
- 编程入门
excerpt: 初次使用PostgreSQL，记录下学习内容
toc: true
---



## 常用sql

### 创建user并赋予指定数据库权限

```sql
-- 创建用户 dbuesr / password
create USER dbuser with PASSWORD 'password';
-- 赋予dbuser对testa的权限
grant USAGE on SCHEMA public to dbuser;
-- 撤销用户对testa的所有权限
REVOKE ALL ON testa FROM dbuser;
-- 撤销用户scheam的使用权限
REVOKE ALL ON SCHEMA public FROM test;
```

## 安装扩展

数据库 -> 右键 -> Query Tool -> 粘贴扩展sql并执行

![](images/postgresql入门/2023-03-06-20-38-52.png)

![](images/postgresql入门/2023-03-06-20-39-16.png)

测试

![](images/postgresql入门/2023-03-06-20-40-13.png)