<h1 align="center">API $$</h1>

<p align="center"><strong>DeepSeek API 余额，常驻 DSH 侧边栏。</strong></p>

<p align="center">不切网页，不把 API Key 交给浏览器，随时确认账户还能跑多久。</p>

<p align="center">
  <strong>简体中文</strong> ·
  <a href="README.en.md">English</a> ·
  <a href="https://github.com/ArcanePivot/dsh-api-balance/releases/tag/v0.2.0">v0.2.0</a> ·
  <a href="#快速安装">快速安装</a> ·
  <a href="INSTALL.md">完整安装手册</a> ·
  <a href="SECURITY.md">安全说明</a> ·
  <a href="CHANGELOG.md">更新日志</a>
</p>

<p align="center">
  <a href="https://github.com/ArcanePivot/dsh-api-balance/actions/workflows/verify.yml"><img src="https://github.com/ArcanePivot/dsh-api-balance/actions/workflows/verify.yml/badge.svg" alt="Verify patches"></a>
  <a href="https://github.com/ArcanePivot/dsh-api-balance/releases/tag/v0.2.0"><img src="https://img.shields.io/badge/release-v0.2.0-16a34a?style=flat-square" alt="v0.2.0 release"></a>
  <img src="https://img.shields.io/badge/DSH-0.1.0--rc.6%20only-111827?style=flat-square" alt="DSH 0.1.0-rc.6 only">
  <img src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS-2563eb?style=flat-square" alt="Windows and macOS">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-16a34a?style=flat-square" alt="MIT License"></a>
</p>

> [!IMPORTANT]
> `v0.2.0` 仅支持 **`@deepseek-ai/dsh@0.1.0-rc.6`**。这是非官方、版本锁定的补丁包，不是原生 Cordis 插件；安装器遇到其他 DSH 版本或已被修改的目标文件会拒绝执行。

## 实际效果

| 中文界面 | English UI |
| --- | --- |
| ![中文 API 余额入口与 API $$ 详情弹窗](docs/screenshots/api-balance-zh.png) | ![English API Balance entry and API $$ details popover](docs/screenshots/api-balance-en.png) |

<details>
<summary>查看 390 px 移动端窄屏效果</summary>

<p align="center">
  <img src="docs/screenshots/api-balance-mobile.png" width="360" alt="API $$ 在 390 px 移动端窄屏中的余额详情">
</p>

</details>

截图来自真实 DSH Web UI；余额、更新时间、工作区和会话信息均已替换或移除。

## 为什么装它

| 一眼看到余额 | Key 留在宿主端 | 随时可以还原 |
| --- | --- | --- |
| 侧边栏常驻当前余额，点击查看账户状态、币种、充值和赠送余额。 | 浏览器只请求同源 DSH 接口，API Key 不进入网页请求，也不会返回前端。 | 首次安装保存带 SHA-256 的官方原件；安装、卸载失败都会回滚。 |

- 中文显示 `API 余额`，英文显示 `API Balance`
- 余额低于 `20 CNY` 时显示警示色
- 支持手动刷新、点击外部关闭和 `Esc` 关闭
- 兼容缺少 `crypto.randomUUID()` 的 HTTP 与旧版 Safari 环境
- Windows 与 macOS 都有安装、卸载和重启辅助脚本

## 快速安装

### 1. 准备 DSH 和 API Key

本补丁只识别 **npm 全局安装**的指定版本；只用 `npx` 临时启动 DSH 时，安装器无法定位目标文件。

```sh
npm install -g @deepseek-ai/dsh@0.1.0-rc.6
```

启动 DSH 后，可在 `设置 -> 模型` 的 DeepSeek 卡片中保存 API Key；也可以让 DSH 进程从环境变量 `DEEPSEEK_API_KEY` 读取。

### 2. 获取项目

```sh
git clone --branch v0.2.0 --depth 1 https://github.com/ArcanePivot/dsh-api-balance.git
cd dsh-api-balance
```

也可以从 [`v0.2.0` 发布页](https://github.com/ArcanePivot/dsh-api-balance/releases/tag/v0.2.0) 下载源码包并在解压目录中执行下列命令。固定版本可以避免以后 `main` 更新时意外安装尚未发布的代码。

### 3A. Windows

```powershell
.\install.ps1 -WhatIf  # 先检查版本、文件和备份条件，不修改任何内容
.\install.ps1          # 备份官方原件、安装并复核 SHA-256
.\relaunch-dsh-web.ps1 # 重启默认 127.0.0.1:3080 的手动 DSH 进程
```

若 DSH 由计划任务管理，请重启原任务，保留它已有的环境变量、权限和后台窗口设置：

```powershell
.\relaunch-dsh-web.ps1 -TaskName "<你的 DSH 计划任务名>"
```

### 3B. macOS

```bash
./install.sh --dry-run  # 先检查，不修改
./install.sh            # 备份官方原件、安装并复核 SHA-256
./relaunch-dsh-web.sh   # 重启默认 127.0.0.1:3080 的手动 DSH 进程
```

若 DSH 由 launchd 管理，请重启原服务：

```bash
./relaunch-dsh-web.sh --launchd-label "<你的 launchd label>"
```

安装后普通刷新一次浏览器即可，不需要清除站点数据或对话记录。自定义端口、PowerShell 执行策略、卸载、升级和常见报错见[完整安装手册](INSTALL.md)。

## 工作方式

```text
浏览器                              DSH 宿主端
POST /api/llm.balance  ---------->  解析 DEEPSEEK_API_KEY
不携带 API Key                      GET {baseURL}/user/balance
                    <------------  返回规范化余额字段
```

宿主端从 `llm-deepseek` 设置和 DSH 凭据服务读取 `baseURL`、`apiKeyEnv` 与 API Key。若配置了自定义 `baseURL`，密钥会发送到该地址，这与 DSH DeepSeek 模型适配器的行为一致；只应使用可信端点。

余额属于账户信息。任何能访问该 DSH Web UI 的人都能看到余额，但看不到 API Key。请继续用原有访问控制保护 DSH Web UI，详见[安全说明](SECURITY.md)。

## 兼容性

| 项目 | 支持范围 |
| --- | --- |
| DSH | 仅 `0.1.0-rc.6` |
| Windows | Windows 10 / 11；Windows PowerShell 5.1 或 PowerShell 7 |
| macOS | macOS 自带 Bash 3.2 或更新版本；Node.js 与 npm 必须可用 |
| 界面语言 | 简体中文、英文 |
| Windows 实机验收 | Windows 10、Node 24、DSH `0.1.0-rc.6` |
| macOS 生命周期验收 | macOS Bash 3.2、Node 22、隔离的官方 rc.6 npm 文件副本 |

> macOS 安装器已在隔离环境跑完安装、重复安装、卸载、重复卸载和篡改拦截。真实机器仍应先运行 `--dry-run`；Windows 对应使用 `-WhatIf`。

## 卸载与升级

Windows：

```powershell
.\uninstall.ps1 -WhatIf
.\uninstall.ps1
```

macOS：

```bash
./uninstall.sh --dry-run
./uninstall.sh
```

升级 DSH 前必须先卸载本补丁、恢复官方文件。不要把旧补丁重新套到新版本 DSH 上；等待本项目发布匹配的新版本。

## 验证

持续集成与本地验证会：

- 从 npm 获取官方 `0.1.0-rc.6` 包
- 验证两个最小补丁可以干净应用
- 验证“官方文件 + 补丁”与 `files/` 中完整文件逐字节一致
- 跑完 macOS 安装、幂等、卸载、回滚和篡改拦截测试
- 检查 Bash、PowerShell、JavaScript 语法及常见密钥和个人路径

```bash
./scripts/verify-patches.sh
```

## 文档

| 文档 | 内容 |
| --- | --- |
| [完整安装手册](INSTALL.md) | 下载、安装、重启、验证、卸载、升级和故障排查 |
| [安全说明](SECURITY.md) | Key 与余额数据流、可信端点和漏洞报告方式 |
| [更新日志](CHANGELOG.md) | 发布状态与版本变化 |
| [第三方声明](THIRD_PARTY_NOTICES.md) | DeepSeek Harness 修改产物的来源与许可证 |
| [参与贡献](CONTRIBUTING.md) | 报告问题、提交修改与隐私注意事项 |

## 项目边界

安装器只覆盖两个已编译文件：宿主余额路由和侧边栏界面。DSH 已提供 `sidebar.footer.action` 插槽和 Client-to-Host 私有调用机制；后续版本计划迁移到官方扩展点，取消覆盖核心编译文件。

`API $$` 是产品显示名称；仓库、安装目录和代码标识继续使用 `dsh-api-balance`，避免 `$` 在命令行中被解释为特殊字符。

## 许可证

本项目新增代码采用 [MIT 许可证](LICENSE)。仓库包含的 DeepSeek Harness 修改产物仍保留原始 MIT 许可与版权，见[第三方声明](THIRD_PARTY_NOTICES.md)。
