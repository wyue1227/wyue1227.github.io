---
title: Python引用自定义Python文件
toc: true
date: 2023-06-07 13:35:27
updated: 2023-06-07 13:35:27
tags: [Python, 代码段]
categories: 开发总结
excerpt: 转载自https://shaojunying.github.io/19d6a4d4a49c4de297d6e3b026e52807.html
---

Python的包引用可以分为如下四种情况

## 情况1 utils和main位于同级目录下
```
--main.py
--utils.py
```

直接单纯`import`即可

```python
# utils.py
def say_hello(name):
    return "hello " + name

# main.py
import utils
if __name__ == '__main__':
    print(utils.say_hello("world"))
```

## 情况2 utils位于main下同级目录下的子目录内
```
--main.py
--dir/
----utils.py
```

利用`from`进行`import`

```python
# main.py
from dir import utils

if __name__ == '__main__':
    print(utils.say_hello("world"))

# dir/utils.py
def say_hello(name):
    return "hello " + name
```

## 情况3 utils位于main的父目录内
```
--utils.py
--dir/
----main.py
```

### 方案一

追加pythonpath(一般默认情况下只有main函数所在的目录会被添加到pythonpath，但是这里的utils.py在main.py的父目录中，所以我们需要将这个父目录也添加到pythonpath中。)

```python
# dir/main.py
import sys
from os import path
# 这里相当于把相对路径 .. 添加到pythonpath中
sys.path.append(path.dirname(path.dirname(path.abspath(__file__))))
import utils

if __name__ == '__main__':
    print(utils.say_hello("world"))

# dir/utils.py
def say_hello(name):
    return "hello " + name
```

### 方案二

使用python -m命令,`python3 -m dir.main`

## 情况4 utils和main处于不同的目录下
```
--dir1/
----utils.py
--dir2/
----main.py
```

解决方法同情况3