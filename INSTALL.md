# API $$ 安装与维护

[简体中文](INSTALL.md) | [English](INSTALL.en.md) | [返回首页](README.md)

`v0.5.x` 是原生 DSH Cordis 组合包。正常安装只修改指定 profile 的依赖清单，不覆盖 DSH 的 npm 文件，也不修改会话目录。

## 安装前检查

1. 安装 Node.js `20.16+`、pnpm 与已验收的 DSH：

   ```sh
   corepack enable
   npm install -g @deepseek-ai/dsh@0.1.0-rc.6
   dsh --version
   pnpm --version
   ```

2. 在 DSH 的 `设置 -> 模型` 中保存 DeepSeek API Key，或让 DSH 进程环境包含 `DEEPSEEK_API_KEY`。
3. 从 [Releases](https://github.com/ArcanePivot/dsh-api-balance/releases) 下载当前 `.tgz` 资产。
4. 确认要安装到哪个 profile。普通 Web UI 使用 `web`。

## 直接用 DSH 安装

```sh
dsh plugin --profile web add ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
dsh --profile web --dump-config
```

配置输出中应出现：

```text
name: '@arcanepivot/dsh-api-balance'
```

这条路径适合首次安装。它使用 DeepSeek Harness 官方的 profile / bundle 机制。

## Windows 包装脚本

包装脚本额外处理 `v0.4.x` 旧补丁迁移，并在安装后复核 profile。

```powershell
.\install.ps1 -PackageSpec .\arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz -WhatIf
.\install.ps1 -PackageSpec .\arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

自定义 profile：

```powershell
.\install.ps1 -Profile my-web -PackageSpec .\arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

若 Windows 阻止下载的脚本，只解除当前项目文件的下载标记，不要永久降低整机执行策略：

```powershell
Get-ChildItem -Recurse -File | Unblock-File
```

## macOS 包装脚本

```bash
./install.sh --package-spec ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz --dry-run
./install.sh --package-spec ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

自定义 profile：

```bash
./install.sh --profile my-web --package-spec ./arcanepivot-dsh-api-balance-0.5.0-rc.1.tgz
```

源码包若丢失可执行权限，可以用 `bash ./install.sh ...` 调用。

## 重启 DSH

插件加入 profile 后需要重启一次 DSH；仅刷新浏览器不会让宿主端加载新 bundle。

手动启动、官方默认端口：

```powershell
# Windows
.\relaunch-dsh-web.ps1
```

```bash
# macOS
./relaunch-dsh-web.sh
```

自定义端口：

```powershell
.\relaunch-dsh-web.ps1 -HostAddress "127.0.0.1" -Port 34567
```

```bash
./relaunch-dsh-web.sh --host 127.0.0.1 --port 34567
```

由计划任务或 launchd 管理时，必须重启原服务，不要另起第二个 DSH 进程：

```powershell
.\relaunch-dsh-web.ps1 -TaskName "<计划任务名>"
```

```bash
./relaunch-dsh-web.sh --launchd-label "<launchd label>"
```

## 验收

1. 普通刷新浏览器，不清除站点数据。
2. 侧边栏底部出现 `API 余额 ¥xx · 今日使用 ¥xx`，英文环境显示 `API Balance ¥xx · Today ¥xx`。
3. 点击后打开 `API $$` 面板。
4. `全部 / V4 Flash / V4 Pro` 可切换，四档 Token、费用和柱状图同步变化。
5. 价格区可切换生效前、空闲、高峰，并显示官方来源。
6. 原有项目、会话和对话记录仍在。

如果余额读取失败但本机用量正常，先检查 DeepSeek Key、`baseURL` 和 DSH 进程环境。插件不会把上游错误正文或 API Key返回浏览器。

## 从 v0.4.x 迁移

旧版曾覆盖两份 DSH 编译文件。最稳妥的迁移方式是保留原安装目录及其中未纳入 Git 的 `backup/` 或 `backup-macos/`：

```sh
git fetch --tags
git checkout v0.5.0-rc.1
```

随后运行对应系统的包装脚本并显式传入 `.tgz`。安装器会先验证旧补丁状态，再恢复官方原件、删除旧备份状态，最后安装原生 bundle。

迁移具有以下保护：

- 备份 SHA-256 不匹配时停止；
- 当前文件不是已知官方原件或已知旧补丁时停止；
- 中途恢复失败时把迁移前文件放回；
- `DSH_HOME/sessions` 不参与操作。

如果旧目录已经丢失，不要从另一台机器复制备份。恢复对应机器原来的 `v0.4.2` 目录与备份完成卸载，或重新安装相同 DSH 版本恢复官方文件后，再安装原生版。

## 升级插件

对同一个 profile 重新执行 `add` 即可更新：

```sh
dsh plugin --profile web add ./arcanepivot-dsh-api-balance-<新版本>.tgz
```

重启 DSH 后复核界面。插件没有独立数据库；统计继续来自 DSH 自己保留的会话。

## 升级 DSH

原生插件不再要求先恢复 DSH 核心文件，但 Harness 处于开发者预览期，官方服务或插槽仍可能变化。建议：

1. 先确认 API $$ 是否已声明支持目标 DSH 版本；
2. 暂时移除插件；
3. 升级并验证 DSH；
4. 安装适配后的 API $$ 版本。

不要因为原生化就跳过兼容性验证。

## 卸载

直接卸载：

```sh
dsh plugin --profile web remove @arcanepivot/dsh-api-balance
```

或使用包装脚本：

```powershell
.\uninstall.ps1 -WhatIf
.\uninstall.ps1
```

```bash
./uninstall.sh --dry-run
./uninstall.sh
```

包装脚本若发现旧 `v0.4.x` 安装状态，也会先安全还原。完成后重启 DSH。卸载不会删除源码下载目录，也不会删除 DSH 会话。

## 常见故障

### 找不到 dsh 或 pnpm

确认运行安装器和启动 DSH 使用同一个系统用户与 PATH：

```sh
command -v dsh
command -v pnpm
```

Windows 使用：

```powershell
Get-Command dsh
Get-Command pnpm
```

### dump-config 没有插件行

确认 profile 名一致，并检查 profile manifest：

```sh
dsh --profile web --dump-config
```

默认位置是 `$DSH_HOME/profiles/web/package.json`；未设置 `DSH_HOME` 时位于 `~/.dsh/profiles/web/package.json`。

### 面板没有出现

宿主 bundle 只在 DSH 启动时加载。确认已经重启原进程、当前 Web UI 使用同一 `DSH_HOME` 和同一 profile，并查看启动日志是否有插件加载错误。

### 统计比官方账单少

这是预期边界。本插件只汇总本机仍保留的 DSH 会话；已删除日志、其他设备和其他客户端不在统计内。最终费用以 DeepSeek 官方账单为准。

### 旧版迁移拒绝覆盖

这表示当前 DSH 文件或备份不属于已知状态。安装器会停下来保护第三方修改。保留完整报错，在删除 Key、余额、用户名和私有路径后提交 Issue。
