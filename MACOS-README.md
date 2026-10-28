# 🍎 Yanpb CodeLab v5.10.0 — macOS Beta 构建与使用指南

本项目现在从同一份源代码构建 Windows (x64)、macOS Apple Silicon (arm64) 和 macOS Intel (x64) 应用。Mac 使用原生 Electron、菜单/交通灯、Apple Clang（通过 xcrun）、clangd（在可用时）、本地 CPH 题目接收、OJ 浏览器提交监视、编辑器和比赛系统。

## 1. macOS 支持状态

| 功能 | macOS Beta |
|---|---|
| 本地 C++11/14/17/20 编译、样例和对拍 | ✅ **需要 Apple Command Line Tools** |
| `#include <bits/stdc++.h>` | ✅ 通过内置兼容头（仅标准 C++ 头文件，不支持 GNU pbds） |
| ICPC/OI 双模式、模板、历史、比赛切换、WA 高亮 | ✅ |
| CSP `.in` / `.out` 本地评测 | ✅，但不等于官方 NOI Linux 环境 |
| Competitive Companion 10043，本地 OJ 结果监听 10045 | ✅ 需浏览器扩展与网络协作，须实机验证 |
| clangd 实时语义诊断 | 条件支持：`xcrun --find clangd` 成功时可用；若只安装 CLT 且没有 clangd，诊断不可用，可安装完整 Xcode |
| GDB/MI 交互断点、变量追踪 | ❌ Windows 功能暂不适配。Mac 需独立开发 LLDB-DAP，不会假装有 GDB |
| 安装与普通代码编辑 | ✅ 无需管理员权限；但未签名版可能被 Gatekeeper 阻止 |

### Mac 上的编译器不再是 Windows GCC

Mac 版走系统许可的 Apple Clang + macOS SDK，**不会把 Windows 的 `g++.exe` 打包进 Mac**，也不会悄悄使用 Homebrew 或自行猜测系统 PATH。首次安装请在 Mac 终端执行：

```bash
xcode-select --install
xcrun --find clang++
```

Apple Command Line Tools 包含 macOS SDK 和 Apple Clang。当前 Beta 版本**不是零环境依赖**。Apple SDK 有自己的分发授权限制，因此没有未经授权地把完整 Apple SDK / Apple 编译工具链塞进 `.dmg`。若用户希望 Mac 也完全免配置，需要单独解决合法可再分发的 Clang/SDK 链接链问题。

### `bits/stdc++.h` 补丁范围

只提供 C++ 标准头文件聚合头。Apple libc++ 与 GNU libstdc++ 的区别可能使一些 GNU 独有算法模板、`__gnu_pbds` 或 GCC 内建扩展无法编译；这类题解仍建议使用 Windows/GCC 或官方 NOI Linux 练习环境验证。

## 2. Mac 本机生成 DMG / ZIP

在 Mac 安装 Node.js 22+（仅构建者需要），解压源码后执行：

```bash
npm install
bash ./build-macos.sh arm64  # M1/M2/M3/M4/M5
# 或者
bash ./build-macos.sh x64    # Intel Mac
```

构建会先验证实际 C++17 编译和执行，完成自动测试，然后用 electron-builder 生成 `dist-macos/` 下的 `.dmg` 和 `.zip` 文件。没有 Apple Developer ID 的构建默认**不签名、不公证**，用于内部测试。切勿承诺陌生学生电脑能直接打开未签名 DMG。

## 3. GitHub Actions 自动发布 Windows + 两种 Mac 架构

上传此版本到仓库后，创建版本 tag：

```bash
git add .
git commit -m 'feat: add macOS builds and Apple Clang support'
git push origin main
git tag -a v5.10.0 -m 'Yanpb CodeLab 5.10.0 Windows and macOS beta'
git push origin v5.10.0
```

`.github/workflows/windows-build.yml` 现在包含 Windows、macOS arm64、macOS x64 三类构建任务；全部成功后才汇总到 GitHub Release（包括各个 SHA-256 校验文件）。触发构建无需在 GitHub Actions 以外的电脑安装 Mac SDK。

## 4. 代码签名与 Gatekeeper

要正式面向学生发布 Mac 安装版，建议申请 Apple Developer Program，使用 `Developer ID Application` 签名，并通过 Apple Notary Service 公证。**当前 Actions 是无签名 Beta**，首次下载后 macOS Gatekeeper 可能拦截，甚至报告应用无法打开。

不要向学生推荐全局关闭 Gatekeeper 或关闭系统完整性保护（SIP）。先完成公证、真实设备安装和各平台 CPH/clangd 验收，再进入 Stable 渠道。可以通过 Apple Developer 的 App Store Connect API key 配置签名/公证，证书密码和密钥只能通过 GitHub Actions Secrets 注入，绝不可加入 Git 仓库。当前版本没有实现自动公证工作流。

## 5. macOS 版已知限制与验收列表

- 本工程在 Linux 上做过语法/回归和兼容头编译测试；**Mac DMG/ZIP 的真实构建、安装、实际 Apple Clang、clangd 与签名/公证均需要 macOS Runner/实机执行。**
- 原 GDB/MI 实现与 Windows GCC 强耦合。Mac 上主动阻止旧 GDB 调试请求并说明原因，不会在无调试器时显示假变量。
- Mac 顶部使用原生窗口交通灯，Cmd+N/O/S、Cmd+Z/Y 等核心快捷键通过 `CmdOrCtrl` 适配；少数自定义快捷键仍需 Mac 实机检查。
- 通过 `xcrun --find clangd` 检测 clangd；找不到时只禁用实时语义诊断，不影响 C++ 编译运行。
- CSP 文件 I/O 与本地程序对拍使用真实 Mac 可执行文件，比赛成绩仍要以 Linux 官方环境为准。

### 建议的 Mac 实机验收（必须在发布 Stable 前完成）

1. Apple Silicon / Intel 分别完成 `xcrun --find clang++` 和 Hello World 编译运行。
2. 包含 `bits/stdc++.h`、`vector`、`queue`、DP 的真实 OI 题目编译。
3. 检查 CPH `localhost:10043`、OJ 浏览器监听 `localhost:10045`。
4. 进行多样例 AC/WA、文件 I/O、对拍和比赛切题。
5. 确认系统 Cmd 快捷键、红黄绿窗口按钮、软件最小化/关闭以及后端进程清理。
6. 签名公证后验证新 Mac 在未关闭 Gatekeeper 的情况下正常安装使用。

参考官方文档：
- Apple: https://developer.apple.com/documentation/xcode/installing-the-command-line-tools
- Electron-builder v26: https://www.electron.build/v26/docs/mac/
- GitHub Actions macOS runners: https://docs.github.com/en/actions/reference/runners/github-hosted-runners
