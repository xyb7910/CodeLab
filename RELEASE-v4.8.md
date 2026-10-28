# Yanpb CodeLab v4.8 — Unified UI / Bundled GCC Only

**本版本从 v4.7 升级，不修改原有比赛数据、算法模板、源码历史、2 秒自动保存、GDB/clangd 功能。**

## 1. 主题与导航精简

- ICPC 蓝绿暗色和 OI 暖橙暗色统一标题栏、导航、运行按钮和编辑器配色；浅色模式继续可用。
- 顶部聚焦 `C++ 标准` / `优化等级` / `内置 GCC 状态` / `样例测试` / `编译运行`，程序运行期间才显示停止。
- 新建比赛、打开比赛、对拍、CPH、快捷键等低频命令放进「更多」菜单；文件打开/保存、模板插入、GDB、历史版本在编辑器的「更多」菜单中。
- 左侧只保留「文件」「模板」「比赛」等核心导航。移除了重复的侧栏主题/设置、文件工具栏保存/打开，以及重复模板入口，但对应键盘快捷键继续可用。
- ICPC / OI 模式切换、CSP 提交检测限制、三向拖拽、代码水印均保留。

## 2. 设置页重新设计

打开右上角齿轮（或 Ctrl+Shift+P），进入分组式 Settings：

| 分类 | 功能 |
| --- | --- |
| 外观与布局 | 中/英文、ICPC/OI 颜色、字号、字体、侧栏布局、终端高度及布局预设 |
| 代码编辑器 | 行号、折行、括号匹配、代码模板、2 秒自动保存、历史快照 |
| 诊断与性能 | clangd 智能/常驻/关闭策略（不影响 GCC 编译） |
| C++ 编译环境 | 内置 GCC 的只读状态、路径和版本，可重新检测；没有外部编译器选择选项 |

配置仍保存在本机并可导入/导出。旧版偏好自动迁移，旧的自定义 compiler 字段不会继续生效。

## 3. 只能使用内置 GCC

**这是 Windows 桌面客户端的编译器策略，后端也执行限制，而非只隐藏下拉框。**

- Windows 仅搜索客户端打包的 GCC，不再扫描 `PATH` 中的 g++/clang++。
- `runner.compile`、对拍、CSP 提交模拟、GDB 变量追踪、交互式 GDB 和 clangd 初始化均使用内置 GCC。
- Electron IPC 拒绝 `system` 或自定义 `g++.exe` 路径。旧配置被规范化为 `bundled`，缺少内置工具链时会清楚报错，**不会回退到系统编译器**。
- 保留之前的 WinLibs 空格路径 junction 修复。正式安装包必须携带完整 GCC/GDB 工具链。
- Linux 源码级回归测试仍可在开发环境使用系统 g++ 运行现有测试；**正式 Windows 应用没有这种回退**。

## 4. Windows 构建

开发电脑安装 Node.js 22+，解压工程后可执行 `build-windows-mirror.bat`（镜像优先与官方源回退），也可用：

```powershell
.\build-windows.bat -ElectronSource Auto
```

Windows 构建流程仍需联网取得首次缺少的 Electron、GCC、GDB、clangd，并做必要编译验证。生成的最终客户端离线运行，无需用户独立安装编译器。

**目前交付的是源码和打包工程，并非已经构建好的 Windows `.exe`。** 新版 Windows 安装、CSP 文件 I/O、GDB 会话及 Electron 下载仍需真实 Windows 环境验收。

## 5. 验证

- `npm test`：**134 / 134 自动测试通过**（Linux）；包括增加的外部编译器拒绝测试、GUI/Settings 结构检查和现有算法功能回归。
- Chromium 实际交互验证：ICPC 与 OI 风格、布局按钮、四类 Settings 页面、状态检测、运行编译器参数（bundled）。
- `preview-icpc.png`、`preview-oi.png`、`preview-settings.png`、`preview-settings-gcc.png` 为本次界面测试截图。
