---
title: Junit测试通过，MavenTest测试未通过
toc: true
date: 2023-06-18 12:45:56
updated: 2023-06-18 12:45:56
tags: [Java]
categories: 爬坑记录
---
### Run Unit Test和Maven test的区别

#### 差异1：

在IDE中通过选中单元测试路径，点击右键选择run test和点击maven中的test是有区别的。在Maven执行测试的过程中，是不允许测试cases访问其他项目的测试类和其他项目的resources下文件的。也就是说，在a/src/test/java下的测试用例，是不能引用b/src/test/java中的类的，同时也不允许访问b/src/test/resources下的资源的。但是在IDE中的Run Unit Test几乎是没有这样的限制的。

#### 差异2：

Maven强制要求src/test/java下不能存在resource的文件，必须放到src/test/reources文件夹下，但是IDE却很少有对应的约束。

### 解决方法

#### 在maven插件配置：（surefire2.14以下版本）
```XML
<plugin>
     <groupId>org.apache.maven.plugins</groupId>
     <artifactId>maven-surefire-plugin</artifactId>
     <version>2.12</version>
     <configuration>
         <forkMode>always</forkMode>
     </configuration>
</plugin>
```

重点加入configureation的配置部分

#### 在maven插件配置：（surefire2.14及其以上版本）

```XML
<plugin>
     <groupId>org.apache.maven.plugins</groupId>
     <artifactId>maven-surefire-plugin</artifactId>
     <version>2.19.1</version>
     <configuration>
         <reuseForks>false</reuseForks>
         <forkCount>1</forkCount>
     </configuration>
</plugin>
```

在2.14以上的版本中，forkMode配置项已经废弃了。