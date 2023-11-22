---
title: OpenPyXL爬坑
toc: true
date: 2023-11-22 21:47:08
updated: 2023-11-22 21:47:08
tags: [Python]
categories: 爬坑记录
---

## 背景

接到需求，批量修改式样书的表纸页和履历页。本以为是简单的改动，但是深深踩了OpenPyXL的坑。

## 测试代码

```python
import shutil
from openpyxl import load_workbook

path = "/Users/xxx/Documents/tmp/openPyXLTest.xlsx"
copyFile = "/Users/xxx/Documents/tmp/openPyXLTest2.xlsx"

shutil.copy(path, copyFile)

wb = load_workbook(copyFile)
wb.save(copyFile)
wb.close()
```

## 运行结果
![](images/OpenPyXL爬坑/2023-11-22-22-40-02.png)

## 总结

根据运行结果可以看出，只是简单的打开、关闭一个 excel 文件，会导致图片以及图形的丢失。

针对图形丢失在网上有很明确的说明，openpyxl 使用 Pillow 处理图片，所以需要安装 Pillow

`pip install Pillow`

安装 Pillow 之后，运行结果如下

![](images/OpenPyXL爬坑/2023-11-22-22-48-58.png)

图形依然丢失

去 OpenPyXL 仓库上翻了翻，这居然是一个陈年老bug [https://foss.heptapod.net/openpyxl/openpyxl/-/issues/1268](https://foss.heptapod.net/openpyxl/openpyxl/-/issues/1268)

涉及到复杂场景的Excel脚本，还是要用VBA啊 =-=







