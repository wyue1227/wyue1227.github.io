---
title: sonarlint扫描结果的修复记录
toc: true
date: 2023-03-06 20:48:01
updated: 2023-03-06 20:48:01
tags: [Java]
categories: 开发总结
excerpt: 记录常见的错误修复方式
---

## Disable XML external entity (XXE) processing' 
### 错误代码
```java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
```

### 解决方法
添加如下代码段
```java
DocumentBuilderFactory dbf = DocumentBuilderFactory.newInstance();
// sonar compliant ---- start
// to be compliant, completely disable DOCTYPE declaration:
dbf.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
// or completely disable external entities declarations:
dbf.setFeature("http://xml.org/sax/features/external-general-entities", false);
dbf.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
// or prohibit the use of all protocols by external entities:
dbf.setAttribute(XMLConstants.ACCESS_EXTERNAL_DTD, "");
dbf.setAttribute(XMLConstants.ACCESS_EXTERNAL_SCHEMA, "");
// or disable entity expansion but keep in mind that this doesn't prevent fetching external entities
// and this solution is not correct for OpenJDK < 13 due to a bug: https://bugs.openjdk.java.net/browse/JDK-8206132
dbf.setExpandEntityReferences(false);
// sonar compliant ---- end
```

## This accessibility update should be removed.

### 错误代码
```java
field.setAccessible(true);
```
### 解决方法
使用反射工具类ReflectionUtils.makeAccessible替换

```java
ReflectionUtils.makeAccessible(field);
```

## This accessibility bypass should be removed.

### 错误代码
```java
field.set(obj, value);
```
### 解决方法
使用 ReflectionUtils.setField替换

```java
ReflectionUtils.setField(field, obj, value);
```

## Use a primitive boolean expression here.

### 错误代码
```java
// getFlag()可能为null，if会报错
if (test.getFlag()) {
    xxxx
}
```
### 解决方法

```java
if (Boolean.TRUE.equals(test.getFlag())) {
    xxxx
}
```

## Merge the previous cases into this one using comma-separated label.

### 错误代码
```java
case a:
case b:
	yyyyyyy
	break;
```
### 解决方法
```java
case a, b:
	yyyyyyy
	break;
```