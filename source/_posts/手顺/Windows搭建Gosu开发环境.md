---
title: Windows搭建Gosu开发环境
date: 2022-12-05 10:45:04
tags: [Windows, Gosu, 开发]
categories: 手顺
excerpt: 目前的项目基于Guidewire框架，使用的开发语言是Gosu。在个人机器上搭建Gosu的开发环境用于学习语法特性。
toc: true
---

## 背景

目前的项目基于Guidewire框架，使用的开发语言是Gosu。在个人机器上搭建Gosu的开发环境用于学习语法特性。

## 环境搭建

### 前期准备

1. [IntelliJ IDEA 2019.3.5](https://www.jetbrains.com/zh-cn/idea/download/other.html)
2. [OS Gosu插件（最新版仅支持2019.3.5，之后的版本无法导入至IDEA）](https://plugins.jetbrains.com/plugin/14128-os-gosu/versions)
3. [Gosu运行环境（gosu-1.14.16-full.zip）](https://gosu-lang.github.io/downloads.html)
4. JDK1.8 + （Gosu依赖基于JDK1.8 +）

### 配置手顺

#### 校验JDK

在命令行中执行`java -version`，查看JDK版本是否 > 1.8。

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-47-11.png)

#### 下载Gosu运行环境并解压缩

[https://gosu-lang.github.io/downloads.html](https://gosu-lang.github.io/downloads.html)

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-47-51.png)

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-48-02.png)

#### IDEA中导入OS Gosu插件（本地导入或在线下载）

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-48-22.png)

### 创建工程
#### 创建一个普通的Java工程

Create New Project

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-49-07.png)

2019.3.5版本的默认JDK为1.11，编译Gosu会产生doc警告，所以更正为JDK8

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-49-18.png)

Next

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-49-35.png)

Finish

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-49-51.png)

创建完成

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-50-07.png)

#### 导入Gosu依赖

File -> Project Structure

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-50-23.png)

Libraries -> Java

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-50-32.png)

选择步骤2.2.2解压缩完的文件夹下的所有依赖 jar 包

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-50-40.png)

OK

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-50-54.png)

#### 创建Gosu类

src -> 右键 -> New -> Gosu类

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-51-09.png)

随便写一个类名

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-51-18.png)

创建完成

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-51-50.png)

#### 编写Gosu代码

Main 类完整代码如下（代码块采用swift，因为Markdown不支持gs）

```swift
class Main {

  static function main(args: String[]) {
    print("hello")
  }
}
```

#### 运行

右键 -> Run

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-52-34.png)

运行结果

![](/images/Windows搭建Gosu开发环境/2022-12-05-10-52-43.png)

## Gosu完整文档
[https://gosu-lang.github.io/docs.html](https://gosu-lang.github.io/docs.html)