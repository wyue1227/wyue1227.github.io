---
title: 关于webservice的理解
toc: true
date: 2022-12-06 22:41:07
tags: Web
categories: 开发总结
excerpt: 在梳理笔记的时候看到了上一个项目开发时记录的总结，遂决定理清一些模糊的概念。
---
## 背景

本科的时候，专业内写网站，使用的完全是RestfulAPI，`SpringBoot + RestController`一把梭，所以我并没有接触过webservice这个概念。第一次遇到还是在项目里，一个满满年代感的项目与维护了十年的代码。

## 概念理清

项目里的webservice，本质上也是RPC(Remote Procedure Call - 远程过程调用)，司空见惯的Client调用Server，跟平时调用API接口在定位上没什么区别。

最大的区别在于实施方法，webservice采用的是SOAP协议，并且会生成WSDL这个描述性文件。

WSDL(Web Services Description Language)就是用XML接口的描述性文件，里面的内容包括Server端的url、可调用的方法、方法需要的参数、方法返回的参数等。基本上可以看作一个全面的API doc。

SOAP(Simple Object Access Protocal - 简单对象访问协议)可以简单理解为`Http + XML`，扩展起来就是Http POST，将header中的一个属性Content-Type设置为text/XML，传输的文本就会被格式化为XML。SOAP封装的内容非常多，包括但不限于消息内容、发送对象、接收处理的的框架等。

UDDI(Universal Description, Discovery and Integration - 通用描述、发现与集成服务)是一种目录服务，通过它，企业可以使用它对 Web services 进行注册和搜索。目前大部分企业使用webservice并不是必须使用UDDI，因为用户通过WSDL知道了webservice的地址，可以直接通过WSDL调用webservice。

整个流程理顺下来就是，Server发布webservice，Client根据Server发布的webservice生成WSDL，发送符合要求的SOAP信息，成功调用Server。

## 利与弊

与SOAP相比，JSON在传输层面轻量了太多。

举例返回调用结果为OK，在JSON下，只需要返回`{"result": "OK"}`。

而在SOAP下，不得不返回大量的描述性文件。

```XML
<?XML version="1.0" encoding="utf-8"?>
<SOAP:Envelope XMLns:xsi="Http://www.w3.org/2001/XMLSchema-instance" XMLns:xsd="Http://www.w3.org/2001/XMLSchema" XMLns:SOAP="Http://schemas.XMLSOAP.org/SOAP/envelope/">
<SOAP:Body>
<GetUserProfileTypesResponse XMLns="Http://zeeq.zune.net/">
<GetUserProfileTypesResult>
<userType>unsignedByte</userType>
</GetUserProfileTypesResult>
</GetUserProfileTypesResponse>
</SOAP:Body>
</SOAP:Envelope>
```

在JSON下，对结果描述不够准确。例如`{"price": 10000}`这行代码，并没有指明10000是int、float又或是double，所以实际开发中不得不用`{"price": "10000.00"}`这种字符串形式让前端自行解析。在XML中，所有的类型都有准确的描述，所以webservice在信息的传输上更精准。

尽管各有各的利弊，时代的推动下，webservice几乎只剩下保守的老项目还在坚守。简洁的webapi已经占据了当前的主流。