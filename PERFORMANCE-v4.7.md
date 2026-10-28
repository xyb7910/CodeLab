# Yanpb CodeLab v4.7 · 内存与磁盘占用优化

## 截图分析

任务管理器显示 `YanpbCodeLab (6)` 总内存约 **193.6 MB**，其中 `clangd.exe` 约 **27.6 MB**。这是**运行内存**，不是安装目录实际存储大小。Electron 的浏览器进程、渲染进程、GPU/辅助进程相互独立，存在多个进程是正常现象。截图当时 CPU 约 0.1%，没有直接显示异常耗电或 CPU 长时间占用。

## 新版调整

1. **clangd 智能启动**：默认 `smart`，首次打开 IDE 不立即启动 clangd；聚焦代码区或编辑源码时按需启动，持续输入只合并发送最新源代码。
2. **空闲回收**：持续 2 分钟不编辑时自动终止 clangd；窗口隐藏时采用较短的 12 秒延迟（浏览器后台定时器可能受系统节流）。重新编辑即可重新启动。不影响 GCC 编译、GDB 调试或编译后错误提示。
3. **DIY 性能模式**：设置 → `clangd 性能策略`：智能（默认）、持续运行（适合大型项目）和关闭（仅编译后报错）。编辑器上的 clangd 状态可以点击主动启动。
4. **clangd 文件安全精简**：完整 clangd 仍在构建缓存中；仅将 `clangd.exe`、必要 DLL、`lib/clang` 的头文件和许可说明复制到 `toolchain-runtime/clangd`。精简版 Windows 构建时须通过 `clangd --version` 检查。GCC/GDB 的原有完整性与冒烟测试保留。
5. **历史快照压缩**：新的代码快照优先使用 gzip（仅当压缩确实更小），旧 `.cpp` 历史仍可读取。保存了 SHA-256 校验，恢复前仍检查数据完整性，不会删除既有用户历史。
6. **安装体积细分报告**：Windows 构建后运行 `npm run report:size`，在 `dist-windows/size-report.json` 中分别统计原始 GCC/GDB、精简 GCC/GDB、原始 clangd、精简 clangd 和最终 Electron 应用大小。**当前不预先声称节约了多少 MB**。

## 构建与安装

先在 Windows x64 构建机安装 Node.js 22+，解压源码并运行 `build-windows-mirror.bat`。脚本会准备固定版本的工具链并做完整性测试，生成安装版与便携版（使用者不需要额外配置 MinGW、clangd 或 GDB）。想生成更小的安装文件，可运行 `build-windows.bat -Compact`，但会增加安装解压耗时。

### 正式发布前必须验证

- 干净 Windows 11 电脑中，从安装包启动，不配置系统 GCC。
- 代码编辑后启动 clangd 并能收到实时诊断；空闲或最小化一段时间后确认 clangd 退出，重新编辑自动恢复。
- `#include <bits/stdc++.h>` 编译与样例测试通过；GDB 断点、局部变量与调用栈可用。
- 比较 `dist-windows/size-report.json`、安装时间、任务管理器内存及多题目切换性能。

### 不建议的“优化”

不要直接从已安装目录删除 `lib/gcc/`、`libstdc++`、`default-manifest.o`、GDB Python DLL 或 Electron 核心文件，也不要关闭 Windows 防护或给进程设置危险的运行参数。若确实需要明显低于 Electron 基线的内存，未来应评估 Tauri 或原生 Windows UI 重构；那是独立工程而不是当前版本的小型补丁。

## 说明

当前交付为完整源码和 Windows 构建脚本，**不是已构建的 `.exe`**；本环境可测试 Node.js 代码与 Chromium UI，但不能从用户截图推算实际磁盘占用，也没有进行 Windows 真实安装体积及内存基准测试。
