---
title: SpringBoot解决跨域问题
toc: true
date: 2022-12-28 16:13:09
updated: 2022-12-28 16:13:09
tags: [Java, 代码段, SpringBoot]
categories: 爬坑记录
---

### 跨域问题

前后端分离的时候出现了跨域问题。。。。虽然可以用Jsonp的方式解决，但是axios推荐利用`CORS`方式解决。

### 解决方法

添加一个拦截器

```Java
package com.wordcard.filter;

import org.springframework.stereotype.Component;

import javax.servlet.*;
import javax.servlet.http.HttpServletResponse;
import java.io.IOException;

/**
 * @author 19745
 */
@Component
public class CORSFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {

    }

    @Override
    public void doFilter(ServletRequest req, ServletResponse res,
                         FilterChain chain) throws IOException, ServletException {
        HttpServletResponse response = (HttpServletResponse) res;
        response.setHeader("Access-Control-Allow-Origin", "*");
        response.setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS, DELETE,PUT");
        response.setHeader("Access-Control-Max-Age", "3600");
        response.setHeader("Access-Control-Allow-Headers", "accept,x-requested-with,Content-Type");
        response.setHeader("Access-Control-Allow-Credentials", "true");
        chain.doFilter(req, res);
    }

    @Override
    public void destroy() {

    }

}
```