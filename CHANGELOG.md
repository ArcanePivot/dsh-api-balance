# Changelog / 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 的基本结构。

## [Unreleased]

## [0.4.0] - 2026-08-15

### Added

- `全部 / V4 Flash / V4 Pro` 三档可点选用量视图，每档独立显示今日、本周、本月、累计 Token 与每日柱状图
- 按官方人民币价格估算每次调用费用，并在四档汇总与每日悬浮明细中展示
- 可切换查看生效前、空闲和高峰三套单价；界面标出当前价档、北京时间高峰区间与官方价格来源

### Correctness

- 费用按每次请求实际发生时间选择价档：2026-08-17 00:00（北京时间）前使用旧价，之后按两个高峰窗口与空闲窗口计算
- 缓存命中、缓存未命中和输出分别计价；DSH 的 `outputTokens` 已包含思考 Token，不重复叠加 `reasoningTokens`
- 无官方价格的未知模型保留 Token 统计并标为未计价，不伪造费用
- 候选版文件与正式版相同时，安装器只提升备份清单版本，不重复覆盖目标文件；预检模式仍保持零写入

### Privacy

- 价格表是带官方来源链接和生效时间的版本化常量，不会把 API Key、提示词或回复正文发送到外部网页
- 估算仍只覆盖本机保留的 DSH 会话，最终扣费以 DeepSeek 官方账单为准

## [0.3.0] - 2026-08-15

### Added

- 从本机保留的 DSH 会话回溯 DeepSeek Token 用量
- 今日、本周、本月、累计四档汇总；本周从周一开始
- 今日缓存命中率与可切换月份的每日柱状图
- 中文、英文和 390 px 窄屏响应式布局
- 经过校验的 `v0.2.0 -> v0.3.0` 原目录升级路径

### Correctness

- Windows PowerShell 5.1 的 `-WhatIf` 预检可正常读取 SHA-256，且仍保持零写入
- 最终 assistant 用量替换同轮临时 usage chunk，避免重复累计
- 仅统计 `deepseek-official`，并排除分叉会话复制的历史前缀
- 日期按浏览器 IANA 时区归类，覆盖周界、月界与闰年
- 单个损坏会话只计入跳过数量，不阻断整个面板

### Security and privacy

- `/api/llm.usage` 不需要 API Key，也不访问外部服务
- 仅返回聚合数字、日期和覆盖范围，不返回提示词或回复正文
- 不创建新的用量数据库；未变化会话的聚合只缓存在当前 DSH 进程

### Compatibility

- 仅支持 `@deepseek-ai/dsh@0.1.0-rc.6`

## [0.2.0] - 2026-08-15

### Added

- Windows 与 macOS 安装、卸载、备份和回滚脚本
- 中文 `API 余额` 与英文 `API Balance` 侧边栏入口
- `API $$` 余额详情、刷新、低余额警示和窄屏布局
- SHA-256 原件校验、幂等安装和篡改拦截
- 中英文首页、安装手册、真实效果图、安全说明与第三方声明

### Changed

- 补丁范围从五个编译文件缩小到两个必要文件
- 重启辅助脚本不再包含个人路径，默认端口改为 DSH 官方的 `3080`
- 缺少 `crypto.randomUUID()` 时使用兼容回退
- 上游错误正文不再转发给浏览器

### Compatibility

- 仅支持 `@deepseek-ai/dsh@0.1.0-rc.6`
- Windows 10 / 11
- macOS，Bash 3.2 或更新版本

[Unreleased]: https://github.com/ArcanePivot/dsh-api-balance/compare/v0.4.0...HEAD
[0.4.0]: https://github.com/ArcanePivot/dsh-api-balance/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/ArcanePivot/dsh-api-balance/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ArcanePivot/dsh-api-balance/releases/tag/v0.2.0
