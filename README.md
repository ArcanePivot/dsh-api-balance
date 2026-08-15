<h1 align="center">API $$</h1>

<p align="center"><strong>DeepSeek API 余额、本机 Token 用量与费用估算，原生常驻 DSH 侧边栏。</strong></p>

<p align="center">不切网页，不把 API Key 交给浏览器，同时看清 V4 Flash / V4 Pro 在不同时段用了多少、预计花了多少。</p>

<p align="center">
  <strong>简体中文</strong> ·
  <a href="README.en.md">English</a> ·
  <a href="#安装">安装</a> ·
  <a href="INSTALL.md">完整手册</a> ·
  <a href="SECURITY.md">安全说明</a> ·
  <a href="CHANGELOG.md">更新日志</a>
</p>

<p align="center">
  <a href="https://github.com/ArcanePivot/dsh-api-balance/actions/workflows/verify.yml"><img src="https://github.com/ArcanePivot/dsh-api-balance/actions/workflows/verify.yml/badge.svg" alt="Native plugin checks"></a>
  <img src="https://img.shields.io/badge/plugin-native%20Cordis-16a34a?style=flat-square" alt="Native Cordis plugin">
  <img src="https://img.shields.io/badge/tested%20DSH-0.1.0--rc.6-111827?style=flat-square" alt="Tested on DSH 0.1.0-rc.6">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS-2563eb?style=flat-square" alt="Windows and macOS">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-16a34a?style=flat-square" alt="MIT License"></a>
</p>

> [!IMPORTANT]
> `v0.5.x` 已从“覆盖两份 DSH 编译文件”的补丁重构为**原生 Cordis 组合包**。安装和卸载均通过官方 `dsh plugin` 命令完成，不修改 DSH 核心文件，也不触碰会话目录。DeepSeek Harness 仍处于开发者预览期；当前只对 `@deepseek-ai/dsh@0.1.0-rc.6` 做过完整验收。

## 实际效果

| 中文界面 | English UI |
| --- | --- |
| ![中文 API 余额、分模型 Token 与峰谷价格](docs/screenshots/api-balance-zh.png) | ![English API Balance, per-model Token usage, and peak pricing](docs/screenshots/api-balance-en.png) |

<details>
<summary>查看 390 px 移动端窄屏效果</summary>

<p align="center">
  <img src="docs/screenshots/api-balance-mobile.png" width="360" alt="API $$ 在 390 px 移动端窄屏中的分模型用量与价格表">
</p>

</details>

截图按真实 DSH Web UI 验收后制作；余额、用量、费用、时间和会话数量均为演示数据。

## 值得安装的理由

| 余额与用量同屏 | Key 留在宿主端 | 原生安装、完整拆除 |
| --- | --- | --- |
| 侧边栏常驻当前余额与今日预估费用，点击查看分模型用量、趋势与价格。 | 浏览器只请求同源 DSH 接口；API Key 不返回前端，也不写入插件文件。 | 使用 DSH 官方 profile 机制加载；卸载后移除插件行与依赖，不留下核心文件改动。 |

- 中文常驻显示 `API 余额 ¥xx · 今日使用 ¥xx`，英文显示 `API Balance ¥xx · Today ¥xx`
- 可点选 `全部 / V4 Flash / V4 Pro`，分别查看 Token、调用次数、费用和每日趋势
- 汇总今日、本周、本月和累计 Token；本周从周一开始
- 按调用发生时刻套用 DeepSeek 官方人民币单价，区分生效前、空闲和高峰时段
- 分开计算缓存命中输入、未命中输入和输出 Token 的预估费用
- 显示今日缓存命中率，以及可切换月份的每日柱状图
- 自动回溯本机仍保留的 DSH 会话，并排除分叉会话复制的历史前缀
- 余额低于 `20 CNY` 时显示警示色；余额接口失败时，本机用量仍可独立显示
- 支持中英文、窄屏、手动刷新、点击外部关闭和 `Esc` 关闭

## 安装

### 1. 准备 DSH 与 API Key

```sh
npm install -g @deepseek-ai/dsh@0.1.0-rc.6
dsh --version
```

在 DSH 的 `设置 -> 模型` 中保存 DeepSeek API Key，或让 DSH 进程从 `DEEPSEEK_API_KEY` 读取。

### 2. 安装原生插件包

从 [Releases](https://github.com/ArcanePivot/dsh-api-balance/releases) 下载当前版本的 `.tgz` 资产，然后在下载目录执行：

```sh
dsh plugin --profile web add ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
dsh --profile web --dump-config
```

第二条命令中出现 `@arcanepivot/dsh-api-balance` 即表示组合成功。重启原有的 `dsh web` 进程并普通刷新浏览器；无需清除站点数据，对话记录不会改变。

仓库还提供会自动迁移旧版补丁的包装脚本：

```powershell
# Windows
.\install.ps1 -PackageSpec .\arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz -WhatIf
.\install.ps1 -PackageSpec .\arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

```bash
# macOS
./install.sh --package-spec ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz --dry-run
./install.sh --package-spec ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

自定义 profile、计划任务重启和故障排查见[完整安装手册](INSTALL.md)。

## 从 v0.4.x 迁移

如果原项目目录内还保留 `backup/` 或 `backup-macos/`，请在**同一目录**切换到 `v0.5.x` 后运行上面的包装脚本。它会：

1. 校验旧备份与当前两份补丁文件；
2. 事务式恢复官方原件并删除旧安装状态；
3. 再调用 `dsh plugin` 安装原生组合包；
4. 全程不读取、复制或删除 DSH 会话。

目标文件若不属于已知官方版本或旧补丁，迁移会停止，不会猜测覆盖。若旧目录已经丢失，先重新取得对应 `v0.4.2` 目录和原备份完成卸载，再安装原生版。

## 工作方式

```text
DSH 浏览器客户端                    DSH 宿主端
sidebar.footer.action  --------->  原生侧边栏入口
shell.overlay          --------->  原生详情面板

GET /api/api-balance/balance --->  credentials/settings -> DeepSeek /user/balance
GET /api/api-balance/usage   --->  汇总本机保留的 DSH 会话事件
                         <---  只返回余额和聚合统计，不返回 Key、提示词或回复正文
```

宿主插件通过 `ctx.webServer.register()` 注册两个精确路由，客户端通过 DSH 的 `sidebar.footer.action` 与 `shell.overlay` 插槽注册界面。Cordis 生命周期负责挂载和拆除；源码不再改写 `dsh-host-apiproxy` 或 `dsh-client-ui-sidebar`。

用量按浏览器 IANA 时区归日，本周从周一零点开始。费用把缓存命中、缓存未命中和输出 Token 分开，并按调用实际发生时刻匹配 [DeepSeek 官方人民币价格](https://api-docs.deepseek.com/zh-cn/quick_start/pricing/)：北京时间 2026-08-17 00:00 前使用旧价，之后高峰为 09:00-12:00、14:00-18:00，其余为空闲价。

这些数字只覆盖本机仍保留的 DSH 会话，不含已删除日志、其他客户端调用，也不是 DeepSeek 官方账单。价格可能变化，最终扣费始终以官方账单为准。

## 兼容性

| 项目 | 当前验收范围 |
| --- | --- |
| DSH | `0.1.0-rc.6` |
| Node.js | `20.16+` |
| Windows | Windows 10 / 11；Windows PowerShell 5.1 或 PowerShell 7 |
| macOS | Bash 3.2 或更新版本 |
| 界面 | 简体中文、英文；390 px 移动端与桌面端 |

原生化把版本变化的风险从“覆盖核心文件”缩小为“官方服务与插槽契约是否变化”，但不代表可以盲目兼容所有未来版本。每个新 DSH 版本仍会单独跑类型、生命周期和真机界面验收。

## 卸载

```sh
dsh plugin --profile web remove @arcanepivot/dsh-api-balance
```

或使用 `uninstall.ps1` / `uninstall.sh`。卸载后重启原 DSH 进程并刷新浏览器。插件依赖、配置层、宿主路由和界面注册都会消失；会话和使用记录保留在 DSH 自己的存储中。

## 开发与验证

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm run build
pnpm pack
```

测试覆盖模型拆分、时区与周界、价格生效点、峰谷边界、分叉去重、路由安全、Cordis 卸载释放、Windows/macOS 原生生命周期及旧补丁迁移。桌面和 390 px 移动端另用真实 DSH + Playwright 做截图、边界、文本溢出和控制台错误检查。

## 社区插件状态

DeepSeek Harness 当前没有公开的“官方认证插件”徽章或人工审核商店。官方 README 给出的社区发现方式是：使用原生可安装 bundle，并为仓库添加 [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic。本项目遵循该格式，但不是 DeepSeek 官方产品。

`files/`、`patches/` 和旧校验脚本只为 `v0.4.x -> v0.5.x` 安全迁移保留，不会进入原生 npm/tarball 分发包。

`API $$` 是界面品牌；仓库、包名和代码标识继续使用 `dsh-api-balance`，避免 `$` 在命令行中被解释为特殊字符。

## 许可证

本项目新增代码采用 [MIT 许可证](LICENSE)。为旧版迁移保留的 DeepSeek Harness 修改产物见[第三方声明](THIRD_PARTY_NOTICES.md)。
