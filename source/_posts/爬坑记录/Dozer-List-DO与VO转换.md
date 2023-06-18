---
title: Dozer-List-DO与VO转换
toc: true
date: 2022-12-29 12:36:26
updated: 2022-12-29 12:36:26
tags: [Java, 代码段]
categories: 爬坑记录
excerpt: Dozer只支持Class转换，不支持List-to-List。以下代码块用于List转换。
---
```Java
import java.util.ArrayList;
import java.util.List;

import org.dozer.Mapper;

public class DozerUtils {

    /**
     * Encapsulate the method of dozer processing set: List < s > > > < T > List
     */
    public static <T, S> List<T> mapList(final Mapper mapper, List<S> sourceList, Class<T> targetObjectClass) {
        List<T> targetList = new ArrayList<T>();
        for (S s : sourceList) {
            targetList.add(mapper.map(s, targetObjectClass));
        }
        return targetList;
    }
}
```