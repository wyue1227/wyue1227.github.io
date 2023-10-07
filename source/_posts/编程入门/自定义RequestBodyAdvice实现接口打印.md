---
title: 自定义RequestBodyAdvice实现接口打印
toc: true
date: 2023-10-07 13:49:31
updated: 2023-10-07 13:49:31
tags: Java
categories: 编程入门
---

注意：只能接受`@RequestBody`类型的input参数。


### Controller
```Java
package com.example.demo.demos.web;

import org.springframework.web.bind.annotation.*;

@RestController
public class BasicController {

    @RequestMapping("/hello")
    @ResponseBody
    public String hello(@RequestBody String name) {
        return "Hello " + name;
    }
}
```

### Advice
```Java
package com.example.demo.demos.web;

import lombok.extern.slf4j.Slf4j;
import org.springframework.core.MethodParameter;
import org.springframework.http.HttpInputMessage;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.RequestBodyAdvice;

import java.io.IOException;
import java.lang.reflect.Type;
import java.util.Arrays;

@Slf4j
@RestControllerAdvice
public class RequestBodyAdviceImpl implements RequestBodyAdvice {
    @Override
    public boolean supports(MethodParameter methodParameter, Type targetType, Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public HttpInputMessage beforeBodyRead(HttpInputMessage inputMessage, MethodParameter parameter, Type targetType, Class<? extends HttpMessageConverter<?>> converterType) throws IOException {
        RequestMapping requestMapping = parameter.getMethodAnnotation(RequestMapping.class);
        log.info("url: " + Arrays.toString(requestMapping.value()));
        log.info("method: " + parameter.getExecutable());
        return inputMessage;
    }

    @Override
    public Object afterBodyRead(Object body, HttpInputMessage inputMessage, MethodParameter parameter, Type targetType, Class<? extends HttpMessageConverter<?>> converterType) {
        log.info("param: " + body);
        return body;
    }

    @Override
    public Object handleEmptyBody(Object body, HttpInputMessage inputMessage, MethodParameter parameter, Type targetType, Class<? extends HttpMessageConverter<?>> converterType) {
        log.info("body: body is Empty");
        return body;
    }
}
```

### 执行结果
![](images/自定义RequestBodyAdvice实现接口打印/2023-10-07-13-54-13.png)

![](images/自定义RequestBodyAdvice实现接口打印/2023-10-07-13-54-39.png)