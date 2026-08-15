# 参与贡献 / Contributing

API $$ 是原生 DSH Cordis 插件。兼容性、隐私、可拆除性和界面稳定性优先于改动数量。

API $$ is a native DSH Cordis plugin. Compatibility, privacy, clean disposal, and UI stability take priority over change size.

## 报告问题 / Report a bug

请提供操作系统、DSH 版本、API $$ 版本、最短复现步骤和经过脱敏的错误。不要公开 API Key、余额、私有 URL、用户名、完整用户目录或会话正文。

Include the OS, DSH version, API $$ version, minimal reproduction, and redacted errors. Never publish API keys, balances, private URLs, usernames, full home paths, or conversation content.

安全问题请通过仓库 Security 页面私下报告。Report security issues privately through the repository Security page.

## 提交修改 / Propose a change

1. 从 `main` 创建短分支，只解决一个明确问题。
2. 修改 `src/`；不要手改 `lib/`。
3. 用户行为变化时同步中英文文档。
4. 运行：

   ```bash
   pnpm install --frozen-lockfile
   pnpm run check
   pnpm test
   pnpm run build
   pnpm pack --dry-run
   ./scripts/test-macos-lifecycle.sh
   ```

5. Windows 相关变化还要运行 `scripts/test-windows-lifecycle.ps1`。
6. 界面变化必须在真实 DSH 上检查桌面和 390 px 移动端，确认无横向溢出、按钮文字截断、遮挡或控制台错误。
7. PR 说明风险、测试范围、兼容版本和卸载方式。

Create a focused branch, edit `src/` rather than generated `lib/`, keep Chinese and English docs aligned, run type/build/unit/package/lifecycle checks, visually verify desktop and 390 px mobile UI changes, and document risk plus rollback in the pull request.

## 兼容性原则 / Compatibility policy

- 使用 DSH 官方 `webServer`、session 服务和 client slots，不覆盖核心编译文件。
- Cordis 注册必须随插件卸载完整释放。
- API Key 只能留在宿主端；浏览器只接收必要的聚合字段。
- 不使用个人路径、固定端口、机器任务名或私有地址作为公共默认值。
- 新 DSH 版本必须单独验收，不根据版本号猜测兼容。
- `files/` 与 `patches/` 仅服务旧版迁移；不要把新功能继续写进旧补丁。

- Use official DSH services and client slots rather than overwriting compiled core files.
- Every Cordis registration must dispose cleanly.
- Keep API keys host-side and return only necessary aggregates.
- Do not ship personal paths, custom ports, local task names, or private addresses as defaults.
- Verify every new DSH baseline explicitly.
- Keep `files/` and `patches/` frozen as migration-only material.
