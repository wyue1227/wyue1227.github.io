---
title: ConfigParser读取properties
toc: true
date: 2023-04-12 20:45:10
updated: 2023-04-12 20:45:10
tags: [Python, 代码段]
categories: 爬坑记录
---

ConfigParser读取properties文件时，properties文件必须有默认的头，例如`[default]`,如果没有会报错。

因为ConfigParser默认是读取ini格式文件，ini文件必须有section header。properties虽然也是key=value格式，但是不强制section header。

解决方式是读取内容后手动加上header，然后交给ConfigParser解析。

```python
content = "[default]\n" + open(bathPath + "\\" + file).read()
config = ConfigParser(allow_no_value=True)
config.read_string(content)
value = config.get('default', key)
```