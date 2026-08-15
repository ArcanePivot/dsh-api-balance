# Changelog / 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 的基本结构。

## [Unreleased]

## [0.5.0-rc.1] - 2026-08-15

### Changed

- 从覆盖 `dsh-host-apiproxy` / `dsh-client-ui-sidebar` 编译文件，重构为可由 `dsh plugin` 安装的原生 Cordis bundle
- 宿主端通过 `ctx.webServer.register()` 提供精确 GET 路由，客户端通过 `sidebar.footer.action` 与 `shell.overlay` 插槽注册界面
- 保留原有余额、分模型 Token、今日/本周/本月/累计费用、每日柱状图、峰谷价格与中英文界面
- 原生分发包不再包含 DSH 修改产物；旧 `files/` / `patches/` 只用于安全迁移 `v0.4.x`

### Added

- TypeScript 源码、预构建 ESM、类型声明与 `cordis.patch.yml`
- Host/Client 单元测试，覆盖路由安全、价格边界、分叉去重、模型拆分与 Cordis 卸载释放
- 真实 DSH 隔离安装验收，以及桌面/390 px 移动端 Playwright 几何、溢出、截图和控制台检查
- Windows PowerShell 5.1 与 macOS 原生安装、重复安装、预检、卸载、重复卸载、会话保留和旧补丁迁移测试

### Migration

- 包装安装器会识别同目录的旧备份，校验后事务式恢复官方原件，再安装原生 bundle
- 卸载通过 profile 移除依赖与组合层；宿主路由、界面插槽和进程缓存随 Cordis 生命周期释放
- 所有安装、升级和卸载路径均不修改 `DSH_HOME/sessions`

## [0.4.2] - 2026-08-15

### Added

- 展开侧边栏后在后台汇总本机当天用量，底部常驻显示 `API 余额 ¥xx · 今日使用 ¥xx`
- 英文界面同步显示 `API Balance ¥xx · Today ¥xx`

### Correctness

- 今日金额复用详情面板的逐请求、分模型、分时段官方价格估算，不另建第二套统计口径
- 余额接口失败时仍可独立显示本机今日用量；用量仍只覆盖本机保留会话，最终扣费以官方账单为准

## [0.4.1] - 2026-08-15

### Fixed

- 成功卸载在恢复两份官方 DSH 文件后，会删除 `backup/` 或 `backup-macos/`、校验清单和其中的原件副本，不再留下项目创建的安装状态
- 目标文件已经由其他方式恢复为官方原件时，卸载器仍会清掉剩余安装状态；重复卸载保持幂等
- 首次安装中途失败时，回滚目标文件后同时删除本次刚创建的备份状态

### Verification

- macOS 生命周期测试新增安装前后 DSH 文件一致性与备份目录零残留断言
- 新增 PowerShell 生命周期测试，覆盖预检、安装、正常卸载、已恢复原件、重复卸载和篡改拦截；CI 在 `pwsh` 环境执行，并另经 Windows 10 / PowerShell 5.1 实机验证

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

[Unreleased]: https://github.com/ArcanePivot/dsh-api-balance/compare/v0.5.0-rc.1...HEAD
[0.5.0-rc.1]: https://github.com/ArcanePivot/dsh-api-balance/compare/v0.4.2...v0.5.0-rc.1
[0.4.2]: https://github.com/ArcanePivot/dsh-api-balance/compare/v0.4.1...v0.4.2
[0.4.1]: https://github.com/ArcanePivot/dsh-api-balance/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/ArcanePivot/dsh-api-balance/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/ArcanePivot/dsh-api-balance/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/ArcanePivot/dsh-api-balance/releases/tag/v0.2.0
