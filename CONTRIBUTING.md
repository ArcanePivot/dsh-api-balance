# 参与贡献 / Contributing

感谢你帮助改进 API $$。本项目修改 DSH 的已编译文件，因此兼容性和可回滚性比改动数量更重要。

Thanks for helping improve API $$. This project patches compiled DSH files, so compatibility and reversibility matter more than the size of a change.

## 报告问题 / Report a bug

请使用仓库的 Bug Report 模板，并提供：

- 操作系统与 DSH 版本
- API $$ 版本
- 可以重复问题的最短步骤
- 已删除 API Key、余额、用户名和私有地址的错误信息

Use the Bug Report template and include the operating system, DSH version, API $$ version, minimal reproduction steps, and redacted errors.

不要在 Issue、截图或日志中提交 API Key、账户余额、私有 URL、本地用户名或完整用户目录。安全问题请使用仓库的 Security 页面私下报告。

Never include API keys, account balances, private URLs, local usernames, or complete home-directory paths in issues, screenshots, or logs. Report security problems privately through the repository Security page.

## 提交修改 / Propose a change

1. 先从 `main` 创建短分支。
2. 将改动限制在一个明确问题内。
3. 同时更新 `patches/` 与 `files/` 中对应产物。
4. 涉及行为或安装步骤时，同步更新中英文文档。
5. 运行：

   ```bash
   ./scripts/verify-patches.sh
   ```

6. 提交 Pull Request，并说明风险、验证方式和回滚方法。

Create a short-lived branch from `main`, keep the change focused, update both `patches/` and `files/`, keep Chinese and English docs aligned, run the verifier, and describe risk, verification, and rollback in the pull request.

## 兼容性原则 / Compatibility policy

- 不绕过 DSH 版本和 SHA-256 检查。
- 不把 API Key 返回浏览器或写入仓库。
- 不用个人路径、固定端口或本机任务名作为公共默认值。
- 新 DSH 版本必须单独适配和验证，不能沿用旧补丁猜测兼容。

- Never bypass DSH version or SHA-256 guards.
- Never return the API key to the browser or commit it to the repository.
- Never use personal paths, custom ports, or local task names as public defaults.
- Adapt and verify each new DSH release explicitly instead of assuming an old patch remains compatible.
