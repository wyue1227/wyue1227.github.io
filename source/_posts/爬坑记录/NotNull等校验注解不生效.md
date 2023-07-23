---
title: NotNull等校验注解不生效
toc: true
date: 2022-06-18 21:24:03
updated: 2022-06-18 21:24:03
tags: [Java]
categories: 爬坑记录
---
## 背景

学习SpringBoot项目中，单元测试时发现`@NotNull`等注解没有生效。

## 原因

没有在调用处添加`@Validated`和`@Valid`注解。

## 示例

### Entity

```Java
public Class User {
    @NotBlank(message = "用户名不能为空")
    private String username;
}
```

### 调用

1.  Controller类上添加`@Validated`注解。
2.  如果是Entity类型的校验，需要在参数前加上`@Valid`。普通类型（如String）则不用。

```Java
@Validated
public class UserController {
    public String getUsername(@Valid User user) {}
    public String getStr(@NotNull String str) {}
}
```