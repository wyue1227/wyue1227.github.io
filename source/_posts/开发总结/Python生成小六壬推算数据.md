---
title: Python生成小六壬推算数据
toc: true
date: 2023-06-18 21:31:10
updated: 2023-06-18 21:31:10
tags: [Python]
categories: 开发总结
excerpt: 帮搞玄学的发小写一段简易算卦代码
---
#Python 

## 关于小六壬
1. 食指下节叫大安，代表最大的吉利。
2. 食指上节叫留连，代表运气平平，凡事拖延。
3. 中指上节叫速喜，代表喜事就在眼前，算各种事情都是上吉的好卦。
4. 中指下节叫空亡，这是最凶的卦，所占事宜均很大的不利。
5. 无名指上节叫赤口，代表多争执有官讼，事态不和。
6. 无名指下节叫小吉，代表将要有好结果，所算的事情值得等待和坚持。

更多详细信息：[http://www.360doc.com/content/20/0407/11/64459437_904388099.shtml](http://www.360doc.com/content/20/0407/11/64459437_904388099.shtml)

## 代码块
```python
from borax.calendars.lunardate import LunarDate

dict_list = ['大安(上上)', '留连(中)', '速喜(上)', '赤口(中下)', '小吉(中上)', '空亡(下)']
time_list = ["子时：00-02点", "丑时：02-04点", "寅时：04-06点", "卯时：06-08点", "辰时：08-10点",
             "巳时：10-12点", "午时：12-14点", "未时：14-16点", "申时：16-18点", "酉时：18-20点",
             "戌时：20-22点", "亥时：22-24点"]

# s_year = int(input("请输入年："))
# s_month = int(input("请输入月："))
# s_day = int(input("请输入日："))
s_year = 2022
s_month = 2
s_day = 13
print('公历 ', s_year, '年', s_month, '月', s_day, '日')

lunar_date = LunarDate.from_solar_date(s_year, s_month, s_day)
month = lunar_date.month
day = lunar_date.day
print(lunar_date.strftime('%G'))
print('农历 ', month, '月', day, '日')
print("===================")

index_month = (month - 1) % 6
result_month = dict_list[index_month]
print("本月运势：" + result_month)
print("===================")

index_day = (index_month + day - 1) % 6
result_day = dict_list[index_day]
print("本日运势：" + result_day)
print("===================")

for index in range(0, 12):
    print(time_list[index] + " 运势：" + dict_list[(index + index_day) % 6])

```

## 输出结果
```
公历  2022 年 2 月 13 日
壬寅年壬寅月丁酉日
农历  1 月 13 日
===================
本月运势：大安(上上)
===================
本日运势：大安(上上)
===================
子时：00-02点 运势：大安(上上)
丑时：02-04点 运势：留连(中)
寅时：04-06点 运势：速喜(上)
卯时：06-08点 运势：赤口(中下)
辰时：08-10点 运势：小吉(中上)
巳时：10-12点 运势：空亡(下)
午时：12-14点 运势：大安(上上)
未时：14-16点 运势：留连(中)
申时：16-18点 运势：速喜(上)
酉时：18-20点 运势：赤口(中下)
戌时：20-22点 运势：小吉(中上)
亥时：22-24点 运势：空亡(下)
```