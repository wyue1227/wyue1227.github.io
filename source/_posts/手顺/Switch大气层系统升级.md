---
title: Switch大气层系统升级
toc: true
date: 2024-10-16 09:41:04
updated: 2024-10-16 09:41:04
tags: [Switch, 游戏]
categories: 手顺
---

## 升级准备

1. 大气层固件包
2. Switch 固件包

![](images/Switch大气层系统升级/2024-10-16-10-03-09.png)

## 升级过程

### 重启机器，进入 Hekate 界面 -> 工具 -> USB工具

![](images/Switch大气层系统升级/2024-10-16-09-59-32.png)

### 点击 SD 卡，并连接 USB 到电脑

![](images/Switch大气层系统升级/2024-10-16-10-00-24.png)


### 备份数据（emuMMC 和 Nintendo 之外的文件夹都挪到本地备份）

emuMMC是虚拟系统的数据
Nintendo是Nintendo Switch系统的数据（如果没有 Nindoo 就只保留 emuMMC）

### 删除上述备份过的数据（emuMMC 和 Nintendo 之外的文件夹）

### 复制大气层固件包和 Switch 固件包到 Switch 内存卡

![](images/Switch大气层系统升级/2024-10-16-10-09-39.png)

红色边框内容保持原有不变。

绿色边框是 Switch 固件包，连带文件夹拷贝到根目录即可。

其他文件是大气层固件包的内容，拷贝到根目录即可。

### 弹出内存卡，进入大气层系统

### 查看当前版本

![](images/Switch大气层系统升级/2024-10-16-10-30-54.png)

### 进入DayBreak

![](images/Switch大气层系统升级/2024-10-16-10-27-17.png)

![](images/Switch大气层系统升级/2024-10-16-10-27-28.png)

![](images/Switch大气层系统升级/2024-10-16-10-27-39.png)

![](images/Switch大气层系统升级/2024-10-16-10-28-24.png)

![](images/Switch大气层系统升级/2024-10-16-10-28-54.png)

![](images/Switch大气层系统升级/2024-10-16-10-29-06.png)

![](images/Switch大气层系统升级/2024-10-16-10-29-15.png)

![](images/Switch大气层系统升级/2024-10-16-10-29-31.png)

![](images/Switch大气层系统升级/2024-10-16-10-29-39.png)


### 升级后查看版本

![](images/Switch大气层系统升级/2024-10-16-10-30-25.png)

此时版本已更新，升级成功

## 报错

### 报错信息

![](images/Switch大气层系统升级/2024-10-16-10-28-04.png)

### 报错原因

MacOS 复制升级文件到 Switch 内存卡时会导入隐藏文件

### 解决方法

连接USB，Mac上命令行运行 `find /Volumes/Untitled/Firmware.18.1.0 -name ".*" -type f -delete`

![](images/Switch大气层系统升级/2024-10-16-09-54-48.png)

再次执行升级则会成功