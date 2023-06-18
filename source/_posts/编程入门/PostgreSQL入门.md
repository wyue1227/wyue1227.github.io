---
title: PostgreSQL入门
toc: true
date: 2023-03-06 20:37:27
updated: 2023-03-06 20:37:27
tags: PostgreSQL
categories: 
- 编程入门
excerpt: 初次使用PostgreSQL，记录下学习内容
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

### 批量为某列每个值前加0

如果是MySQL正常使用CONCAT即可，例如

`UPDATE students SET grade = CONCAT('0', grade)`

在postgresql中可以使用 `||`

`UPDATE students SET grade = '0' || grade`

```sql
before
+----+-----------+----------+-------+ 
| id | first_name| last_name| grade | 
+----+-----------+----------+-------+ 
| 1  | Alice     | Smith    | 85   | 
| 2  | Bob       | Johnson  | 90   | 
| 3  | Charlie   | Brown    | 80   | 
+----+-----------+----------+-------+ 
after
+----+-----------+----------+-------+ 
| id | first_name| last_name| grade | 
+----+-----------+----------+-------+ 
| 1  | Alice     | Smith    | 085   | 
| 2  | Bob       | Johnson  | 090   | 
| 3  | Charlie   | Brown    | 080   | 
+----+-----------+----------+-------+ 
```

## 安装扩展

数据库 -> 右键 -> Query Tool -> 粘贴扩展sql并执行

![](images/postgresql入门/2023-03-06-20-38-52.png)

![](images/postgresql入门/2023-03-06-20-39-16.png)

测试

![](images/postgresql入门/2023-03-06-20-40-13.png)