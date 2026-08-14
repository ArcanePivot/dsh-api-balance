# API $$ 安装与维护

[简体中文](INSTALL.md) | [English](INSTALL.en.md) | [返回首页](README.md)

本文覆盖下载、安装、重启、验收、卸载、升级和常见故障。安装器只支持 npm 全局安装的 `@deepseek-ai/dsh@0.1.0-rc.6`。

## 安装前检查

1. 安装 Node.js 与 npm。
2. 全局安装指定 DSH 版本：

   ```sh
   npm install -g @deepseek-ai/dsh@0.1.0-rc.6
   ```

3. 确认版本：

   ```sh
   dsh --version
   ```

4. 在 DSH 的 `设置 -> 模型` 页面保存 DeepSeek API Key，或让启动 DSH 的进程环境包含 `DEEPSEEK_API_KEY`。
5. 确认没有其他补丁改过 `dsh-host-apiproxy/lib/index.js` 或 `dsh-client-ui-sidebar/lib/client.js`。首次安装会核对官方文件的 SHA-256。

> [!NOTE]
> 只运行 `npx @deepseek-ai/dsh web` 不等于全局安装。API $$ 需要稳定、可定位的全局 DSH 目录。

## 获取项目

推荐固定到正式发布标签，避免以后 `main` 更新时意外安装尚未发布的代码：

```sh
git clone --branch v0.2.0 --depth 1 https://github.com/ArcanePivot/dsh-api-balance.git
cd dsh-api-balance
```

也可以从 [`v0.2.0` 发布页](https://github.com/ArcanePivot/dsh-api-balance/releases/tag/v0.2.0) 下载源码包。解压后，在包含 `install.ps1` 和 `install.sh` 的目录打开终端。

## Windows

### 安装

在 PowerShell 中运行：

```powershell
.\install.ps1 -WhatIf
.\install.ps1
```

`-WhatIf` 会完成版本、源文件、目标文件和备份状态检查，但不会写入 DSH。正式安装首次会把官方原件和校验清单保存到 `backup/`。

若 Windows 阻止运行从互联网下载的脚本，只解除当前项目文件的下载标记：

```powershell
Get-ChildItem -Recurse -File | Unblock-File
.\install.ps1 -WhatIf
```

不要为了本项目永久降低整台机器的 PowerShell 执行策略。

### 重启

手动运行、使用官方默认端口 `3080` 的 DSH：

```powershell
.\relaunch-dsh-web.ps1
```

自定义地址或端口：

```powershell
.\relaunch-dsh-web.ps1 -HostAddress "127.0.0.1" -Port 34567
```

计划任务托管的 DSH 应重启原任务，而不是另起第二个进程：

```powershell
.\relaunch-dsh-web.ps1 -TaskName "<你的 DSH 计划任务名>"
```

这样会保留计划任务中的 `DSH_HOME`、API Key、代理、权限模式和隐藏窗口设置。

### 卸载

```powershell
.\uninstall.ps1 -WhatIf
.\uninstall.ps1
.\relaunch-dsh-web.ps1
```

若由计划任务管理，最后一条改为带 `-TaskName` 的命令。

## macOS

### 安装

```bash
./install.sh --dry-run
./install.sh
```

如果源码包解压后丢失可执行权限，可以显式通过 Bash 调用：

```bash
bash ./install.sh --dry-run
bash ./install.sh
```

首次安装会把官方原件和校验清单保存到 `backup-macos/`。

### 重启

手动运行、使用官方默认端口 `3080` 的 DSH：

```bash
./relaunch-dsh-web.sh
```

自定义地址或端口：

```bash
./relaunch-dsh-web.sh --host 127.0.0.1 --port 34567
```

launchd 托管的 DSH 应重启原服务：

```bash
./relaunch-dsh-web.sh --launchd-label "<你的 launchd label>"
```

默认服务域是 `gui/<当前用户 UID>`；系统级服务可增加 `--launchd-domain system`。

### 卸载

```bash
./uninstall.sh --dry-run
./uninstall.sh
./relaunch-dsh-web.sh
```

若由 launchd 管理，最后一条改为带 `--launchd-label` 的命令。

## 验收

1. 浏览器普通刷新一次，不需要清除站点数据。
2. 侧边栏底部出现 `API 余额` 或 `API Balance`。
3. 点击后显示 `API $$` 详情弹窗。
4. 点击刷新后能看到账户状态、币种、充值余额、赠送余额和更新时间。
5. 原有项目、会话和对话记录保持不变。

安装器本身可以重复执行。目标文件已经是本项目版本且备份有效时，它会报告已安装，不会重复覆盖。

## 升级 DSH

正确顺序：

1. 运行本项目卸载器，恢复官方文件。
2. 重启并确认 DSH 可以正常打开。
3. 升级 DSH。
4. 等待 API $$ 发布与新 DSH 版本完全匹配的补丁。

不要在升级 DSH 后直接重跑旧安装器。版本和 SHA-256 拦截就是为了避免旧补丁覆盖新代码。

## 常见故障

### 找不到全局 DSH

报错包含 `Could not locate a global @deepseek-ai/dsh installation` 或 `could not locate a global`。

```sh
npm install -g @deepseek-ai/dsh@0.1.0-rc.6
npm root -g
```

确认运行安装器和启动 DSH 使用的是同一个用户及同一套 Node/npm。

### DSH 版本不支持

本版本只支持 `0.1.0-rc.6`。不要绕过检查；先卸载或重装正确版本，或等待适配新版本的 API $$。

### 目标文件不是官方原件

首次安装时目标文件必须与官方 npm 包一致。若装过其他补丁，先用那个项目自己的卸载器恢复；无法确认时，重新安装官方 DSH 后再运行 `-WhatIf` 或 `--dry-run`。

### 余额不可用

依次检查：

1. `设置 -> 模型` 中的 DeepSeek Key 是否已保存。
2. 若用环境变量，重启 DSH 的服务是否真的继承了 `DEEPSEEK_API_KEY`。
3. 自定义 `baseURL` 是否可信、可达并支持 `/user/balance`。
4. DSH Web UI 是否经过反向代理；同源 `/api/llm.balance` 必须能到达原 DSH 宿主。

不要把 API Key、余额截图或私有地址贴进公开 Issue。

### 重启后页面仍是旧界面

确认重启的是实际提供当前页面的 DSH 进程和端口，然后普通刷新。无需清除站点数据；清除数据反而可能移除本地界面偏好。

### 卸载器拒绝覆盖

这表示目标文件、备份清单或 SHA-256 不再匹配。卸载器会停下以免覆盖第三方修改。保留完整报错，在不包含 Key 和私有路径的前提下提交 Issue。

## 本地验证

有 Bash、Git、npm 和 Node 时，可以运行与持续集成相同的核心检查：

```bash
./scripts/verify-patches.sh
```

该检查会下载官方 npm 包到临时目录，不会在当前机器正式安装 DSH。
