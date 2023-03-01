---
title: web.xml中load-on-startup的作用
date: 2023-03-01 21:05:45
updated: 2023-03-01 21:05:45
tags: [Java]
categories: 开发总结
---
1.  load-on-startup 元素标记容器是否应该在web应用程序启动的时候就加载这个servlet，(实例化并调用其init()方法)。
2.  它的值必须是一个整数，表示servlet被加载的先后顺序。
3.  如果该元素的值为负数或者没有设置，则容器会当Servlet被请求时再加载。
4.  如果值为正整数或者0时，表示容器在应用启动时就加载并初始化这个servlet，值越小，servlet的优先级越高，就越先被加载。值相同时，容器就会自己选择顺序来加载。