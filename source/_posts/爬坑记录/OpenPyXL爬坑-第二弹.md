---
title: OpenPyXL爬坑_第二弹
toc: true
date: 2023-12-04 19:55:21
updated: 2023-12-04 19:55:21
tags: [Python]
categories: 爬坑记录
---

这是一段平平无奇的代码，用于获取冻结单元格


```python
import shutil
import openpyxl

path = "/Users/xxx/Documents/tmp/openPyXLTest.xlsx"

wb = openpyxl.load_workbook(path)
sheet = wb["Sheet"]
print(sheet.freeze_panes)
wb.close()
```

文件内容如下

![](images/OpenPyXL爬坑-第二弹/2023-12-04-20-43-01.png)

执行效果如下

![](images/OpenPyXL爬坑-第二弹/2023-12-04-20-44-58.png)

看上去一切正常

但是当文件滚动条变更之后，如图

![](images/OpenPyXL爬坑-第二弹/2023-12-04-20-45-44.png)

它的执行结果就变成了

![](images/OpenPyXL爬坑-第二弹/2023-12-04-20-46-43.png)

没错，只要滚动条滚动了，取出来的值就是不正确的。如同源码展示的，它只会取 topLeftCell ,而这个值只会在加载的时候初始化，所以冻结的单元格行数，并不能准确取到。

![](images/OpenPyXL爬坑-第二弹/2023-12-04-20-48-29.png)

已提交issue，期待回复 

[https://foss.heptapod.net/openpyxl/openpyxl/-/issues/2119](https://foss.heptapod.net/openpyxl/openpyxl/-/issues/2119)

回复结果：

应该使用`sheet.sheet_view.pane.ySplit`获取冻结行数

输出结果 `3.0`