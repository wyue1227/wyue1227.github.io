---
title: Mac下初次打开App点击取消导致无法再打开
toc: true
date: 2022-11-28 17:44:50
updated: 2022-11-28 17:44:50
tags: [Mac]
categories: 爬坑记录
---

1.  打开终端
2.  输入`sudo xattr -d com.apple.quarantine /Applications/PyCharm.app`（根据app不同最后更正为不同的名字）
