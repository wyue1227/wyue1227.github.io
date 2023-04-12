---
title: newbee-mall-api部署手顺
date: 2023-01-10 20:07:08
updated: 2023-01-10 20:07:08
tags: [Java]
categories: 手顺
excerpt: 在服务器上部署新蜂商城的API
toc: true
---

## 简介

newbee-mall-api 是一个前后端分离商城系统的后端API接口。

## 项目地址

https://gitee.com/newbee-ltd/newbee-mall-api

## 部署

### Clone代码

![](images/newbee-mall-api部署手顺/2023-01-10-20-07-57.png)

### 导入 SQL

#### 创建DB

DB名：newbee_mall_db_v2（参照 `application.properties` -> `spring.datasource.url`字段）

#### 执行SQL

SQL文件位置：`newbee-mall-api\src\main\resources\newbee_mall_db_v2_schema.sql`

MySQL导入命令：source

**※导入失败的解决方案**

{% post_link 爬坑记录/MySQL执行SQL脚本报错1231(42000) %}

### 项目配置

更改resources（newbee-mall-api\src\main\resources）下关于DB的相关配置。

包括数据库地址、用户名、密码等。

![](images/newbee-mall-api部署手顺/2023-01-10-20-24-33.png)

### 利用mvn install打jar包

![](images/newbee-mall-api部署手顺/2023-01-10-20-24-44.png)

### 运行jar包

![](images/newbee-mall-api部署手顺/2023-01-10-20-24-56.png)

**※更多运行jar包形式参照**

[https://www.cnblogs.com/hxun/p/11325558.html](https://www.cnblogs.com/hxun/p/11325558.html)

### 登录swagger查看接口

![](images/newbee-mall-api部署手顺/2023-01-10-20-25-41.png)