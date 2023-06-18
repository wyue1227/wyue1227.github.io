---
title: java外字处理爬坑
toc: true
date: 2023-05-25 01:09:44
updated: 2023-05-25 01:09:44
tags: [Java, 代码段]
categories: 爬坑记录
---

## 背景

日语内外字不在常规Unicode编码集内，需要手动更换成编码集内的文字。

## 坑点

外字在本地文档/服务器文档编码集符合文档提供的规则，但是在Stream流内会自动解析成`\\uFFFD\\uxxxx`。例如SJIS编码下`F141`的文字，在UTF8下编码为`E08D`，但是进入Stream流后变成了`\\uFFFD\\u0041`，所以要在代码内实际确认一下对应的编码。同时因为外字转成了`\\uFFFD\\uxxxx`，所以位数变成了2位，而且外字变换常规字符后可能会由一个字符变成多个字符，对应Byte的切分要注意位数变更。


## 相关代码段

### 打印字符串unicode编码

```Java
public static void printUnicode(String str) {
    for (int i = 0; i < str.length(); i++) {
        char c = str.charAt(i);
        System.out.printf(String.format("\\u%04X ", (int) c));
    }
    System.out.println();
}
```

### 变换外字
```Java
Map<String, String> convertMap = new HashMap<>(); 
convertMap.put("\\uFFFD\\u0041", "さい"); 
convertMap.put("\\uFFFD\\u0042", "そね"); 

for (Map.Entry<String, String> entry : convertMap.entrySet()) { 
	String key = entry.getKey(); 
	String value = entry.getValue(); 
    // repaceAll支持直接变换Unicode
	String info = info.replaceAll(key, value); 
}
```