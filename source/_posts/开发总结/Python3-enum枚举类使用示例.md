---
title: Python3-enum枚举类使用示例
toc: true
date: 2022-12-29 12:41:48
updated: 2022-12-29 12:41:48
tags: [Python, 代码段]
categories: 开发总结
---
```python
from enum import Enum

# 声明枚举类
class Branch(Enum):
    MAIN = "main branch"
    DEV = "develop branch"


print(Branch.MAIN.name) # MAIN
print(Branch.MAIN.value) # main branch
print(Branch["MAIN"]) # Branch.MAIN
print(Branch("main branch")) # Branch.MAIN
print(Branch.MAIN) # Branch.MAIN

print(Branch.MAIN == Branch.MAIN) # True
print(Branch.MAIN == Branch.DEV) # False

print(Branch.MAIN is Branch.MAIN) # True

for branch in Branch:
    print(branch)
    # Branch.MAIN
    # Branch.DEV

for branch in Branch.__members__:
    print(branch)
    # MAIN
	# DEV
```