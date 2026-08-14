# Changelog / 更新日志

本项目遵循 [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) 的基本结构。版本发布前保持 `Unreleased` 标记，避免把仓库代码误写成已经发布的 GitHub Release。

## 0.2.0 - Unreleased

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
