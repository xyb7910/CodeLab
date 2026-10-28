# Yanpb CodeLab v3.6 · 快速安装与轻量化发行

v3.6 保持原有的 **纯本地离线 C++17 IDE**、CPH、CSP 模拟、ICPC/OI 双模式、2 秒自动保存、代码历史版本、GDB 变量追踪和免配置 GCC。

## 两种可用 Windows 构建方式

| 发行方式 | 构建命令 | 压缩方案 | 实际效果与取舍 |
| --- | --- | --- | --- |
| **Fast（默认）** | `build-windows.bat` | NSIS `useZip:true` + `differentialPackage:false` | 优先降低安装解压时间；安装 EXE 往往比 LZMA 大 |
| **Compact（紧凑）** | `build-windows.bat -Compact` | NSIS 7z/LZMA，`compression:maximum` | 优先减小安装 EXE；解压可能更慢 |

Fast 模式会同时生成 Setup 安装版和 Portable 免安装版；Portable 仍使用默认 7z 压缩以降低携带文件大小。Compact 模式只生成高压缩的 Setup 安装包（避免同次打包重复生成相同便携版）。两种模式均自带相同的精简 GCC + GDB，不依赖目标电脑的 PATH。

## 安装后存储减少

原先的 Windows 工程把 WinLibs 的整个 `mingw64` 安装目录复制到 `resources/toolchain/mingw64`，其中包含 IDE 暂时不需要的其他语言工具和多语言帮助文件。

v3.6 新增一个可复现的构建阶段：

1. 保留原始完整 WinLibs GCC/GDB；**不直接删除、移动、破坏原始编译器**。
2. 在 `toolchain-runtime/mingw64` 创建精简发行副本，仅裁剪常见非运行用途组件（非 C++ 命令行工具、文档、man/info、翻译、图片等）。保留 C++ GCC/GDB、编译器内部程序、标准库头文件、MinGW 库、`libexec`、系统运行 DLL、GDB Python 支持和许可证。
3. 构建前对**将要真正装进 EXE 的精简副本**运行强制验证：`g++ --version`、`gdb --version`、编译 `bits/stdc++.h`、运行 C++、使用 `-O0 -g` 编译并由 GDB 在 main 处断点执行。任何一步失败立即终止构建，**不会生成不完整的免配置安装包**。
4. Electron 保留 `en-US.pak` 与 `zh-CN.pak`，移除其他不使用的 Chromium 语言资源，不删除版权和许可证文件。
5. 在 `dist-windows/size-report.json` 自动记录完整工具链、精简工具链、安装后的程序目录、安装文件体积和裁剪比例。**不要在未构建 Windows 安装包前臆测最终节省量。**

## Windows 开发者一步构建

先在构建机安装 Node.js 22+，解压源码后运行：

```powershell
# 推荐：学生机房部署，快速安装
.\build-windows.bat

# 教练分享/传输，安装文件更紧凑
.\build-windows.bat -Compact
```

首次构建需要联网下载 Electron 和 SHA-256 固定校验的 WinLibs GCC 发行包；脚本优先使用 Windows 自带的 `tar.exe` 解压 ZIP，缺失时退回 `Expand-Archive`。**成品在学生电脑使用时完全离线**。如 GitHub 下载不可用，可给 PowerShell 脚本传递 `-Archive <本地 WinLibs zip 路径>`，仍执行原有 SHA-256 校验。

构建完毕执行：

```powershell
npm run report:size
```

或直接查看 `dist-windows/size-report.json`。已知 `toolchain-runtime` 只是生成产物，不应与完整工具链一起分发源码；打包器只加载精简版本。

## 注意事项

- **源码 ZIP 不包含已编译的 .exe，也不包含大体积的 WinLibs 工具链。** 编译安装包需要 Windows 构建机；生成后的 EXE 才是学生免配置成品。
- ZIP 安装包可能**比以前更大**，但在实际 Windows 电脑上通常具有更快的解压性能；具体秒数取决于 SSD、杀毒软件、CPU 与工具链实际体积。
- **压缩不会降低安装后的占用空间**；只有精简工具链、Electron 语言资源的裁剪能降低实际安装占用。
- 当需要除 C++/GDB 外的其他 GCC 命令行工具时，应使用原始 WinLibs 发行版；v3.6 精简工具链针对本 IDE 运行闭环，而非通用完整编译器 SDK。
- 本地学生数据、历史版本和草稿保留在 Windows AppData。**不会清空旧版本的用户数据**。
- 安装到旧版本相同位置覆盖更新前，务必先备份重要代码和本地历史文件。
- 当前环境已验证构建逻辑及模拟文件裁剪规则，但未下载完整 Windows 工具链、未进行真实 Win10/Win11 安装计时和成品大小测量。请用 Windows 构建阶段的强制验证与最终体积报告完成验收。

### 主要文件

- `build/prepare-toolchain.cjs` — 构建轻量 GCC/GDB 运行目录（缓存、大小统计）
- `build/verify-toolchain.cjs` — 拦截缺失工具链，Windows 上编译运行 + GDB 真正断点冒烟测试
- `build/after-pack.cjs` — Electron 语言资源清理
- `build/report-size.cjs` — 安装包、程序与工具链空间统计
- `build/compact.builder.cjs` — 高压缩比变体
- `scripts/build-windows.ps1` — 一键准备、验证、构建及生成报告

参考： [electron-builder NSIS 配置](https://www.electron.build/v26/docs/nsis/)。`useZip` 只有在 `differentialPackage:false` 的安装包构建时生效。

作者：Yanpb
