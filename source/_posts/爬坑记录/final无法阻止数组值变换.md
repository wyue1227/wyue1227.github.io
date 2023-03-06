---
title: final无法阻止数组值变换
date: 2023-03-06 20:52:36
updated: 2023-03-06 20:52:36
tags: Java
categories: 爬坑记录
toc: true
---

final是引用不可变，值还是可以改变的。

```java
public class App {

	public static final String[] array = {"1", "2"};

	public static void main(String[] args) throws Exception {

		for (int i = 0; i < array.length; i ++) {
			System.out.print(array[i] + " ");
		}
		System.out.print("\n");
		array[0] = "3";
		for (int i = 0; i < array.length; i ++) {
			System.out.print(array[i] + " ");
		}
		
	}
}
// 输出结果
// 1 2 
// 3 2 
```
