# 食记 · 饮食展示页

本仓库只负责静态页面、浏览器本地解密和 GitHub Pages 部署。不读取 Supabase，不持有数据库密钥或加密口令。

## 数据流程

`wyue1227/GithubAction` 读取 Supabase 饮食文字 → 整理允许字段、按月加密 → 提交密文到本仓库 `site/data/` → 自动验证并部署 → 浏览者输入口令后在本机解密。

- 来源保持不变；不读取 R2 图片，不合并同名食品，不将未知热量当作零。
- 热量显示近似整数，区间取中间值；原始热量表述仍保留。
- 数据目录只允许 `vault.json` 和 `m-<密文哈希>.json`，均是 AES-256-GCM 密文。禁止提交原始数据、口令和数据库凭据。
- 分享口令仅用于浏览器本次解密，不上传、不保存到 localStorage/IndexedDB；闲置或锁定后清除展示内容。
- 页面只请求本站资源，不在浏览时连接 Supabase、R2 或 Cloudflare Worker。

## 发布

推送 main（无论页面代码还是导入的密文数据）后自动测试并部署 `site/`。PR只验证。也可手动运行 Pages 工作流，无需任何输入或数据库 Secrets。

导入脚本、数据权限、首次全量/每日增量更新均在 [GithubAction 仓库](https://github.com/wyue1227/GithubAction)，不是这里。详见 [部署说明](docs/饮食面板部署.md)。

## 本地查看与检查

```bash
python3 -m http.server 8137 --bind 127.0.0.1 --directory site
node --test tests/*.test.mjs
node scripts/check-site.mjs
```

无数据时可查看明确标注的虚构示例。真实数据必须由导入流程提供，不能用示例冒充。

旧五十音版本为 `4f7cc10dc2be3c81501d260475f0976a47719ee1`，可从 Git 历史恢复；未删除浏览器原练习数据库。旧五十音文档及截图属于历史资料。

## 隐私边界

Pages 的代码和密文可公开下载；保护依赖强独立口令，不是服务器端账号鉴权。不要使用公开示例口令。换口令须在 GithubAction 全量重新加密；Git 历史和接收者已下载的旧密文无法撤回。国内真实设备访问仍需实际测试。
