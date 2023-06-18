---
title: python应用简单总结
toc: true
date: 2023-02-14 19:36:40
updated: 2023-02-14 19:36:40
tags: [Python, 代码段]
categories: 开发总结
excerpt: 最近用Python写了点代码生成的小工具，但是太久没写以至于边写边查，在此记录总结
---

### 跨文件调方法

```python
# FileA.py
def test():
    print("testA")
```

```python
# FileB.py
import FileA
FileA.test()
```

### 跨文件调类

```python
# FileA.py
class A {
    def test(self):
        print("testA")
}
```

```python
# FileB.py
from FileA import A
a = A()
a.test()
```

### 随机掉用list内元素

```python
import random
print(random.choice([1, 2, 3]))
# 输出1 2 3中随机一个
```

### 字符串模板化

```python
from string import Template
templateStr="hello, $name"
print(Template(templateStr).substitute(name="world"))
# hello, world

data = "hello, {name}"
print(data.format(name="world"))
# hello, world
```

### 根据字符串调用方法

```python
# 利用方法名字符串调用方法
class Test:
    def test(self, param: str):
        print(param)

    def main():
        func = getattr(self, "test")
        data = func()
```

更多参照：[https://mozillazg.com/2016/03/python-exec-function-globals-and-locals-arguments.html](https://mozillazg.com/2016/03/python-exec-function-globals-and-locals-arguments.html)

### 常用文件处理

```python
import os
import shutil

def createFile(content: str, folderPath: str, fileName: str):
    # 路径不存在时创建文件夹
    if not os.path.exists(folderPath):
        os.makedirs(folderPath)
    # 需要设置newline="\n", encoding="utf-8"时追加参数
    writeContent(folderPath + fileName, content)

def copyFile(fromPath: str, toPath: str):
    shutil.copy(fromPath, toPath)

def getFileContent(filePath: str, newline="\n", encoding="utf-8") -> str:
    file = open(filePath,'r', encoding=encoding, newline=newline)
    data = file.read()
    file.close()
    return data

def writeContent(filePath: str, content: str, newline="\n", encoding="utf-8"):
    # newline控制换行符，Windows下设置为\r\n，Unix下设置为\n
    file = open(filePath, "w+", encoding=encoding, newline=newline)
    file.write(content)
    file.close()
```

### 生成随机日期

```python
# 生成日期范围内的日期
from datetime import datetime, timedelta

def random_date(startDate, endDate) -> str:
    delta = endDate - startDate
    seconds = delta.total_seconds()
    n = random.randrange(seconds)
    return startDate + timedelta(seconds=n)

startDate = datetime.strptime('1/1/2022', '%m/%d/%Y')
endDate = datetime.strptime('12/31/2022', '%m/%d/%Y')
print(str(random_date(startDate, endDate)))
```

### Excel数据转list
Excel数据直接粘贴到编辑器中时，单元格数据之间有换行符`\t`，可以借此拆分

```python
data = '''
test1	test2	test3
test11	test22	test33
'''
data = data.splitlines()
data.remove('')
result = []
for tmp in data:
    tmpList = tmp.split("\t")
    result.append(tmpList)
print(result)
# [['test1', 'test2', 'test3'], ['test11', 'test22', 'test33']]
```