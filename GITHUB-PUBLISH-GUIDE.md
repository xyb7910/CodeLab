# Yanpb CodeLab v5.10.0 — GitHub 上传、Windows + macOS 编译与 Release 版本发布

> 提醒：此工程目前 `package.json` 中 `license` 为 `UNLICENSED`。如果发布为 **Public**，代码仍能被所有人阅读；没有开源许可证并不自动让代码不可见。想保留闭源源代码，请使用 Private 仓库，并考虑通过其他渠道向学生分发 EXE，或将公开安装包放在单独的发行仓库。

## 0. 解压项目

解压当前 GitHub Ready ZIP，进入顶层 **`Yanpb-CodeLab-v5.9/`**，确保看到 `package.json`、`electron/`、`scripts/`、`.github/workflows/`。**不是把整个 ZIP 作为一个文件上传 GitHub。**

建议安装 [Git for Windows](https://git-scm.com/download/win) 和 [GitHub Desktop](https://desktop.github.com/)。GitHub Desktop 是图形化方法，Git CLI 更适合 Tag 发布。

## 1. 创建仓库

登录 GitHub，选择 `New repository`，命名 `Yanpb-CodeLab`。按是否需要公开源码选择 Private 或 Public。**不要勾选 Initialize with README/.gitignore/license**（本项目自带文件）。创建后复制 HTTPS URL，如 `https://github.com/<YOUR_USERNAME>/Yanpb-CodeLab.git`。

## 2. 首次上传（Git Bash 或 PowerShell）

在项目根目录打开终端：

```bash
git init -b main
git add .
git status --short
git commit -m "feat: initial Yanpb CodeLab v5.10.0"
git remote add origin https://github.com/YOUR_USERNAME/Yanpb-CodeLab.git
git push -u origin main
```

已有 Git 仓库请跳过 `git init`；已有 `origin` 则先 `git remote -v` 核实，必要时改用 `git remote set-url origin ...`。GitHub 认证通过浏览器或 Git Credential Manager 完成，**不要写入明文密码或 token**。

图形方法：用 GitHub Desktop → File → Add local repository → 选择项目目录（提示创建仓库时点击 Create）→ Commit → Publish repository。

## 3. 第一次发布：v5.10.0

确保 `package.json` 中 `version` 为 `5.10.0`，全部测试通过：

```bash
npm test
git tag -a v5.10.0 -m "Release v5.10.0"
git push origin v5.10.0
```

然后打开 GitHub 仓库 → **Actions → Yanpb CodeLab Windows and macOS Release**，监控自动构建。该工作流使用 GitHub 官方 Windows/macOS runner 分别构建，远端首次构建需要联网下载 WinLibs GCC、GDB、clangd、Electron 和 NSIS，网络不可用时构建会失败，不表示已经生成 EXE。

构建成功后，在 **Releases** 将出现 `v5.10.0`，包含：

- `Yanpb-CodeLab-ZeroConfig-Setup-5.10.0-x64.exe`
- `Yanpb-CodeLab-ZeroConfig-Portable-5.10.0-x64.exe`
- `Yanpb-CodeLab-macOS-5.10.0-arm64.dmg`、对应的 `.zip`（Apple Silicon）
- `Yanpb-CodeLab-macOS-5.10.0-x64.dmg`、对应的 `.zip`（Intel Mac）
- `SHA256SUMS-Windows.txt`、`SHA256SUMS-macOS-arm64.txt`、`SHA256SUMS-macOS-x64.txt`

下载链接通常类似：`https://github.com/YOUR_USERNAME/Yanpb-CodeLab/releases/latest`。源代码仓库为 Private 时，该链接仅对有访问权限的用户开放。

手动执行 `Actions → Windows Release → Run workflow` 会生成短期 Artifact，但不会生成新的 Release（因为没有 Tag）。

## 4. 发布下一个版本：v5.10.1

修改工程后检查 `git diff`、`npm test`。把版本号从 `5.10.0` 更新为 `5.10.1`：

```bash
npm version 5.10.1 --no-git-tag-version
# 编辑 RELEASE-v5.9.md 或增加新版本说明
git add .
git commit -m "fix: release v5.10.1"
git push origin main
git tag -a v5.10.1 -m "Release v5.10.1"
git push origin v5.10.1
```

每个 Release 使用不同 Tag，不要把新的二进制冒充旧版本，也不要随意覆写已向学生分发的 Release。

常见版本规则：

- `5.10.0 → 5.10.1` 修复 Bug；
- `5.10.0 → 5.10.0` 增加向后兼容的新功能；
- 大范围不兼容改版才考虑主版本号升级。

## 5. 注意事项

- `.gitignore` 排除 Windows 工具链、node_modules、Electron 安装包和本地密钥，但保留 GCC 与 clangd 第三方声明文本。
- `.github/workflows/ci.yml` 在 push/PR 时执行 `npm test`；`windows-build.yml` 在每个符合格式的版本标签上构建与创建 Release。
- Release 工作流声明 `contents: write`（用于创建 Release）。若 GitHub 组织策略禁止写入，需由仓库管理员检查 Actions 权限。
- GitHub Actions **Artifacts 会过期**，给学生下载安装包应优先使用 Releases。
- 编译出来的 EXE、内置 GCC/GDB、clangd、版权声明是否在安装包内，需要 Windows 构建成功后的人工验收。
- 此仓库不含 Windows Electron/GCC 大型二进制，不能仅靠下载源码 ZIP 就直接双击运行 IDE。

## macOS 构建说明

两种 Mac 架构由 `macos-15` runner 执行 `build-macos.sh arm64/x64` 构建。**Mac Beta 使用 Apple Clang / macOS SDK，要求用户安装 Xcode Command Line Tools；当前无 Apple 签名与公证，不是正式面向陌生学生电脑可直接运行的稳定版。** GDB/MI 仅 Windows 可用。详见 [MACOS-README.md](MACOS-README.md)。
