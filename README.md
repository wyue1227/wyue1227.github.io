# 食记 · 私密饮食热量面板

从原五十音/单词卡站改造。改造前版本为 `4f7cc10dc2be3c81501d260475f0976a47719ee1`，仍可从 Git 历史恢复；本次没有删除浏览器里的 `gojuon-db` 练习记录。

## 体验

- 保留清晰的面板交互：月份与日历选日期、按餐次查看、份量/热量原文/备注、本月关键词查找。
- 只展示文字，不读取 R2、照片或其他个人记录。
- 热量显示近似整数，区间取中间值，原始数据不改；未知不算零。条目合计与来源中的“当日汇总”分别展示，绝不相加。
- 食品名重复正常保留，唯一身份是源记录 ID；不生成冗长日记。
- 页面所有脚本、字体（系统字体）、样式和数据只依赖本站，不在浏览时连接 Cloudflare Worker/Supabase/R2。
- 分享口令在浏览器本地解密；不上传、不保存到 localStorage/IndexedDB，15分钟无操作或后台5分钟自动锁定。此功能保护新访问，不是撤回已下载内容的账号系统。

## 本地看页面

```bash
cd /Users/wangyue/code/wyue1227.github.io
python3 -m http.server 8137 --bind 127.0.0.1 --directory site
```

打开 http://127.0.0.1:8137/ ，点“查看虚构示例”。无需数据库和口令。示例是虚构的，不会被误认为本人数据。

测试加密加载可用 Node22+ 执行下面的**虚构测试口令**命令；它不是实际分享口令：

```bash
DIET_SHARE_PASSPHRASE=fictional-local-preview-only node scripts/export-diet.mjs --demo --output .preview/private-test
python3 -m http.server 8138 --bind 127.0.0.1 --directory .preview/private-test
```

打开 http://127.0.0.1:8138/ ，使用上面的虚构口令。请勿用这个公开示例口令加密真实数据。

## 导出与发布

`scripts/export-diet.mjs` 使用 Node 内置 fetch/crypto，无第三方依赖；Supabase 只 GET/HEAD，不修改数据库、不访问 R2。

1. 精确 profile 过滤、稳定游标分页、核对精确计数。
2. 读取全部 `diet_entries` 和 `diet_days` 的允许字段，去掉内部源路径、profile标识、价格等非展示字段。
3. 按月比较旧快照，复用未变化的密文；修改、补录、改日期和删除均由全量核对覆盖。
4. PBKDF2-SHA256（600,000次）派生密钥，随机16字节盐、12字节IV、AES-256-GCM加密，每个文件独立随机参数。
5. 只有加密索引及加密月份文件进入Pages artifact；密钥、口令、原始JSON都不进入仓库或网页。
6. 全部完成后发布；读取、验证或解密旧数据失败时终止，不覆盖线上上一版。

详细操作、权限与未完成项见 [部署与接入](docs/饮食面板部署.md)。

## 发布工作流与午夜任务

`.github/workflows/pages.yml`：推送main后自动验证、全量构建加密快照并部署（包括首次发布）；PR只验证，不读取真实数据。需要一次性配置部署文档中的4项Variable/Secrets，缺配置时失败并保留旧站点。手动/外部API调用仍须publish=true，initialize=false复用旧快照；首次手动发布须initialize=true。

没有增加GitHub原生cron，避免重现以前的调度问题。计划由现有GithubAction仓库的新增任务派发本仓库工作流，每天日本00:00（UTC15:00）。**该跨仓库调度尚未部署**，需要本仓库Secrets、目标仓库Actions权限及现有调度器的显式接入。旧Notion任务本次没有改动。

## 验证

```bash
node --test tests/*.test.mjs
node scripts/check-site.mjs
```

旧 `docs/本地开发与部署说明.md`、`docs/验收报告.md` 和旧截图属于五十音历史资料，不是本次饮食面板验收证据。

注意：GitHub Pages代码和密文可公开下载；保密依赖强独立口令，弱口令可被离线猜测。换口令需全量重加密，不能收回别人已有的旧快照。国内无需VPN的实际访问质量仍需对方实测，不由本地验证保证。
