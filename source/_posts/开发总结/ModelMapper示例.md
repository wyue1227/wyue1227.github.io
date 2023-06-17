---
title: ModelMapper示例
toc: true
date: 2023-06-17 13:06:18
updated: 2023-06-17 13:06:18
tags: [Java, 代码段]
categories: 开发总结
excerpt: 简单记录ModelMapper的使用
---

## Dto
### DtoA
```java
package com.example;

public class DtoA {
    Integer userNo;
    String userName;
    String userPassword;

    /**
     * 用于ModelMapper
     */
    public DtoA() {
    }

    public DtoA(Integer userNo, String userName, String userPassword) {
        this.userNo = userNo;
        this.userName = userName;
        this.userPassword = userPassword;
    }

    public Integer getUserNo() {
        return userNo;
    }

    public void setUserNo(Integer userNo) {
        this.userNo = userNo;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserPassword() {
        return userPassword;
    }

    public void setUserPassword(String userPassword) {
        this.userPassword = userPassword;
    }

    @Override
    public String toString() {
        return "com.example.DtoA [userNo=" + userNo + ", userName=" + userName + ", userPassword=" + userPassword + "]";
    }
}

```
### DtoB
```Java
package com.example;

/**
 * @author wyue
 */
public class DtoB {

    Integer userNo;
    String userName;
    String userPassword;

    /**
     * 用于ModelMapper
     */
    public DtoB() {
    }

    public Integer getUserNo() {

        return userNo;
    }

    public void setUserNo(Integer userNo) {
        this.userNo = userNo;
    }

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUserPassword() {
        return userPassword;
    }

    public void setUserPassword(String userPassword) {
        this.userPassword = userPassword;
    }

    @Override
    public String toString() {
        return "com.example.DtoB [userNo=" + userNo + ", userName=" + userName + ", userPassword=" + userPassword + "]";
    }
}
```

## Main

匹配/过滤配置全放在`PropertyMap`中，主要用到了`Converter`和`Condition`。

```Java
package com.example;

import org.modelmapper.AbstractConverter;
import org.modelmapper.Condition;
import org.modelmapper.ModelMapper;
import org.modelmapper.PropertyMap;
import org.modelmapper.convention.MatchingStrategies;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class App {

    public static void main(String[] args) {

        List<DtoA> aList = new ArrayList<>();
        DtoA a1 = new DtoA(1, "1", "1");
        DtoA a2 = new DtoA(2, "2", "2");
        aList.add(a1);
        aList.add(a2);

        PropertyMap<DtoA, DtoB> propertyMap = new PropertyMap<>() {
            @Override
            protected void configure() {
                // userNo:2 -> userNo:22
                using(new AbstractConverter<Integer, Integer>() {
                    @Override
                    protected Integer convert(Integer source) {
                        return source == 2 ? 22 : source;
                    }
                }).map(source.getUserNo(), destination.getUserNo());

                // userName:2 -> userName:22
                using(new AbstractConverter<String, String>() {
                    @Override
                    protected String convert(String source) {
                        return Objects.equals(source, "2") ? "22" : source;
                    }
                }).map(source.getUserName(), destination.getUserName());

                // userPassword:1 -> null, 2 -> 2
                Condition<String, String> passwordCondition = ctx -> "2".equals(ctx.getSource());
                when(passwordCondition).map(source.getUserPassword(), destination.getUserPassword());
            }
        };

        List<DtoB> result = new App().mapList(aList, DtoB.class, propertyMap);
        for (DtoB tmDtoB : result) {
            System.out.println(tmDtoB);
        }
    }

    public <S, T> List<T> mapList(List<S> source, Class<T> targetClass, PropertyMap<S, T> propertyMap) {
        ModelMapper modelMapper = new ModelMapper();
        modelMapper.getConfiguration().setFieldMatchingEnabled(true);
        modelMapper.getConfiguration().setMatchingStrategy(MatchingStrategies.STRICT);
        if (propertyMap != null) {
            modelMapper.addMappings(propertyMap);
        }
        return source.stream().map(element -> modelMapper.map(element, targetClass)).toList();
    }
}
```

## 3 更多资料

https://www.cnblogs.com/haoyul/p/10864139.html