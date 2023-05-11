---
title: localstack常用命令
date: 2023-05-11 20:51:49
updated: 2023-05-11 20:51:49
tags: AWS
categories: 开发总结
excerpt: 在wsl2中创建安装localstack，实现本地s3疏通
toc: true
---

## 创建bucket

`aws --endpoint-url=http://localhost:4566 s3api create-bucket --bucket cs-d1-accom-s3-apl-local`

## 创建folder（创建文件去掉最后的/）

`aws s3api put-object --bucket cs-d1-accom-s3-apl-local --key Batch/input/ --endpoint-url http://localhost:4566`

## 拷贝文件

`aws --endpoint-url=http://localhost:4566  s3 cp TableConfigurationForDelete.json s3://cs-d1-accom-s3-apl-local/Batch/input/`

## 查看所有bucket

`aws --endpoint-url=http://localhost:4566 s3 ls`

## 查看bucket下所有文件

`aws --endpoint-url=http://localhost:4566 s3api list-objects --bucket cs-d1-accom-s3-apl-local`

## 删除指定文件

`aws --endpoint-url=http://localhost:4566 s3api delete-object --bucket <bucket_name> --key <object_key>`

例如：
`aws --endpoint-url=http://localhost:4566 s3api delete-object --bucket cs-d1-accom-s3-apl-local --key test.csv`

## 下载文件到本地

`aws --endpoint-url=http://localhost:4566 s3api get-object --bucket <bucket_name> --key <object_key> <local_file_path>`

`aws --endpoint-url=http://localhost:4566 s3api get-object --bucket cs-d1-accom-s3-apl-local --key test.csv /home/testuser/`

## 清空bucket

`aws --endpoint-url=http://localhost:4566 s3 rm s3://your-bucket-name --recursive`

`aws --endpoint-url=http://localhost:4566 s3 rm s3://cs-d1-accom-s3-apl-local --recursive`

## 报错
TimeoutError: gave up waiting for edge server on 0.0.0.0:4566

解决方式：断开VPN