# Yanpb CodeLab v5.10 — Windows + macOS Beta

新增 Apple Silicon 和 Intel 两种 macOS 架构打包（DMG、ZIP）、Apple Clang 工具链检测、`bits/stdc++.h` 标准头兼容、native macOS 交通灯、Cmd 快捷键、跨平台官方 GitHub Release 工作流。

**Mac Beta 限制：** 当前 Apple Clang 需要 Xcode Command Line Tools（`xcode-select --install`）。Mac 原生 GDB/MI 调试不可用，未来须适配 LLDB-DAP。未签名 / 未公证的 DMG 不保证通过 Gatekeeper。GitHub Mac runner 真正构建 / Mac 设备端到端验收尚未完成，不声称已有现成 DMG。

Windows Setup 与 Portable 及 Windows GCC/GDB/clangd 构建策略不变，使用同一源码继续构建。

详见 [MACOS-README.md](MACOS-README.md)。
