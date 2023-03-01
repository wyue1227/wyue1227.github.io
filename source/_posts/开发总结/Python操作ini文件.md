---
title: Python操作ini文件
date: 2023-03-01 20:45:21
updated: 2023-03-01 20:45:21
tags: [Python, 代码段]
categories: 开发总结
excerpt: 完善Python工具时整理用
toc: true
---

## 前期说明

### 项目结构
```text
PythonINIDemo
	|-MysqlConfig.ini
	|-PythonINIDemo.py
```

### MysqlConfig.ini文件初始内容
```ini
[prod]
url = jdbc:mysql://localhost:3306/prod
username = prod1
password = prod11
```

## Python操作

### 查询
```python
import configparser

config = configparser.ConfigParser()
config.read("MysqlConfig.ini", encoding="utf-8")

# 获取所有的section节点
print(config.sections()) # ['prod']

# 获取指定section的所有key
print(config.options("prod")) # ['url', 'username', 'password']

# 根据section与option，获取指定值
print(config.get("prod", "url")) # jdbc:mysql://localhost:3306/prod
print(config.get("prod", "username")) # prod1
print(config.get("prod", "password")) # prod11

# 获取section下所有的option(key, value)
print(config.items("prod")) # [('url', 'jdbc:mysql://localhost:3306/prod'), ('username', 'prod1'), ('password', 'prod11')]

# 检查指定 section/option 是否存在
print(config.has_section("prod")) # True
print(config.has_option("prod", "url")) # True
print(config.has_section("dev")) # False
print(config.has_option("prod", "token")) # False
```

### 增改

#### 代码
```python
import configparser

config = configparser.ConfigParser()
config.read("MysqlConfig.ini", encoding="utf-8")

dev_section = "dev"
dev_option = ["url", "username", "password"]
dev_url = "jdbc:mysql://localhost:3306/dev1"
dev_username = "dev1"
dev_password = "dev11"

# 创建section
if not config.has_section(dev_section):
    config.add_section(dev_section)

# 创建option
if not config.has_option(dev_section, dev_option[0]):
    config.set(dev_section, dev_option[0], dev_url)

# 创建option
if not config.has_option(dev_section, dev_option[1]):
    config.set(dev_section, dev_option[1], dev_username)

# 创建option
if not config.has_option(dev_section, dev_option[2]):
    config.set(dev_section, dev_option[2], dev_password)

# 修改option(option不存在则创建)
config.set(dev_section, dev_option[2], "update_dev")

# 将变更写入文件
config.write(open("MysqlConfig.ini", "w"))
```

#### 测试结果（MysqlConfig.ini文件）
```python
[prod]
url = jdbc:mysql://localhost:3306/prod
username = prod1
password = prod11

[dev]
url = jdbc:mysql://localhost:3306/dev1
username = dev1
password = update_dev
```

### 删除
```python
import configparser

config = configparser.ConfigParser()
config.read("MysqlConfig.ini", encoding="utf-8")

config.add_section("test")
config.set("test", "url", "testUrl")
config.set("test", "username", "testUserName")

print(config.items("test")) # [('url', 'testUrl'), ('username', 'testUserName')]

# 删除option
config.remove_option("test", "url")
print(config.items("test")) # [('username', 'testUserName')]

# 删除section
config.remove_section("test")
print(config.has_section("test")) # False
```