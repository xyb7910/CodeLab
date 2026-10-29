# Yanpb CodeLab v5.10.10 — 独立浏览器判题插件

Chrome/Edge 插件现已作为独立版本 `Yanpb OJ Result Bridge 2.0.0` 发布。GitHub Release 同时提供插件 ZIP、Windows 安装版/便携版与 macOS ARM64/Intel 安装包；插件仍随 IDE 离线附带。

插件负责监听 Codeforces、AtCoder、洛谷官方结果，通过一次性六位 PIN 与本机 IDE 配对，不读取账号密码或 Cookie，也不会自动点击提交。安装说明见 [`oj/submit-extension/README.md`](oj/submit-extension/README.md)。

---

# Yanpb CodeLab v5.10.3 — 官方 AC/WA 浏览器回传修复

本版修复 Chrome/Edge 扩展监听中的动态状态更新、MV3 后台休眠及 Submission ID 识别遗漏问题。需同时更新 CodeLab 源码和 Yanpb OJ Result Bridge **v1.3.0** 扩展；Competitive Companion 的题目导入仍使用 10043，判题回传继续使用 10045。

[具体修复、安装与连接自检](./RELEASE-v5.10.3-OFFICIAL-AC-SYNC.md)

---

# Yanpb CodeLab v5.10.2 · Browser Pairing UI Hotfix

**修复旧版 App 找不到 6 位浏览器扩展授权码的错误。** 顶部“更多工具”→“OJ 浏览器连接”，或原生菜单“工具”→“OJ 浏览器连接（6 位授权码）”。

[查看详细升级、安装和连接指南](./RELEASE-v5.10.2-PAIRING-FIX.md)

- 官方题目接收 CPH：`127.0.0.1:10043`
- OJ 判题浏览器扩展：`127.0.0.1:10045`（首次需要六位 PIN）
- 当前为 Windows/macOS 源码及构建工程，并非已编译的 EXE/DMG；请按原工程的构建说明打包。

---

# Yanpb CodeLab v5.10.1 — Chrome/Edge 判题桥接稳定性修复

本版本修复浏览器扩展断开、重复打开提交标签、Submission ID 不回传、后台休眠、Mac/Windows 重启后的监听丢失问题。

**必须同时升级 CodeLab 客户端和 Chrome/Edge 扩展到 v1.2.0**。使用步骤见 [RELEASE-v5.10.1-BROWSER-FIX.md](RELEASE-v5.10.1-BROWSER-FIX.md)。

Windows 和 macOS 构建流程与 v5.10 相同，本 ZIP 为源码，不包含预编译 EXE/DMG。

---

# Yanpb CodeLab v5.10 — Windows + macOS Beta

- Windows：内置 GCC / GDB / clangd，Setup 和 Portable EXE。
- macOS ARM64 (Apple Silicon) / x64 (Intel)：原生 Electron DMG / ZIP；C++ 编译使用 Apple Clang + macOS SDK，**需要 Xcode Command Line Tools**。
- 共享：ICPC/OI、样例对拍、CSP 文件 I/O 模拟、编辑器补全、Competitive Companion、代码模板、历史版本和浏览器 OJ 判题提醒。
- Mac 原版 GDB/MI 暂不可用，需要后续适配 LLDB；Mac 未签名 Beta 尚未公证，不保证 Gatekeeper 放行。

**Mac 建置文档：** [MACOS-README.md](MACOS-README.md)  
**GitHub Actions 双平台发行：** [GITHUB-PUBLISH-GUIDE.md](GITHUB-PUBLISH-GUIDE.md)

---

# Yanpb CodeLab v5.9.0

**GitHub 首次上传与 Windows Release 自动打包：参见 [GITHUB-PUBLISH-GUIDE.md](./GITHUB-PUBLISH-GUIDE.md)。**

最新 Windows EXE 下载：本仓库的 **Releases** 页面（上传并发布首个 Tag 后可用）。

---

# Yanpb CodeLab v5.8 — 竞赛状态栏、操作去重、明暗主题

基于 v5.7 的界面小版本升级。

[**v5.8 更新说明**](./RELEASE-v5.8.md)

---

# Yanpb CodeLab v5.7 提交功能（继续保留）

**本版取消内嵌 OJ 窗口，改用 Competitive Companion（导入题目） + Yanpb OJ Submit Bridge（浏览器提交）。**

首次安装步骤、官网核对和安全限制：见 [RELEASE-v5.7.md](./RELEASE-v5.7.md)。

---

# Yanpb CodeLab v5.6

**新增受校验的一键 OJ 提交尝试、醒目的官方 AC/WA/评测中状态卡片。** 具体使用与限制参见 [RELEASE-v5.6.md](./RELEASE-v5.6.md)。

# Yanpb CodeLab v5.5 — Competitive Companion 浏览器直连

**打开浏览器题目，点击 Competitive Companion 图标，CodeLab 自动获得题目与样例；不用配对码、不用复制 JSON。**

详见 [COMPETITIVE-COMPANION-v5.5.md](./COMPETITIVE-COMPANION-v5.5.md)。

---

# Yanpb CodeLab v5.4 · 官方 Submission ID 自动识别

本版本新增从官网提交详情页/记录列表自动识别 Submission ID，并与极速提交冻结源码任务关联。不会自动向网站提交代码；结果核对必须以官方记录为准。

[新版使用与安全说明](./SUBMISSION-ID-v5.4.md)

---

# Yanpb CodeLab v5.3 · Fast Contest Submit

**新增极速 OJ 提交：** `Ctrl + Shift + U` 冻结当前源码，在 CodeLab 内打开官方 HTTPS 提交页面并尝试自动填入，之后由用户官网确认，按官方真实记录查询状态。支持按题保存提交任务队列，Codeforces 按比赛/题号/记录号严格匹配；AtCoder、洛谷若无法核实题号，则结果标记待核对。

[阅读操作指南与平台接入限制](./FAST-OJ-v5.3.md)。

> 当前交付完整源码和 Windows 安装包构建工程，非已生成的 `.exe`。

---

# Yanpb CodeLab v5.2 · 官方 OJ 提交工作台

**重点升级：应用内 Codeforces / AtCoder / 洛谷官方网页窗口、源码填表、官方提交记录查询；移除 3 分钟配对码依赖。**

[完整使用、安全边界、测试说明](./RELEASE-v5.2.md)

注意：v5.2 不会绕过官网登录、验证码，也不会未经确认自动点击提交按钮；在线评测结果必须来自真实的官方提交记录，不能根据本地样例推测。需要 Node.js 22+ 在 Windows 构建电脑上运行 `build-windows-mirror.bat` 生成 Windows 安装版及免安装版，学生成品仍可离线编译 C++（在线提交当然需要联网）。

---

# Yanpb CodeLab v5.1 · OJ 提交助手与变量智能提示

本版本新增：Competitive Companion 导入题目的网页提交助手、可选浏览器填表扩展，以及 clangd 实时语义补全与本地变量提示。**网页提交必须由用户亲自确认；本地样例通过不代表官方 AC。**

**优先查看 [v5.1 功能、兼容性、安装及安全说明](./RELEASE-v5.1.md)。**

---

# Yanpb CodeLab v5.0 — Local Submissions & Editor Prompts

## 重点更新

- **移除手动 WA/AC 记分**，不再人工填报 ICPC 判题状态。
- **本地提交：** 编译、运行已配置样例、存储每次源码快照与提交历史；没有有效预期答案时绝不伪报官方 AC。
- **自定义代码编辑提示词：** 新增/编辑/删除/分类，支持 `{code}`、`{selection}`、`{errors}`、`{file}`、`{task}`，只在本机生成并复制，不提供自动调用 AI 的网络功能。
- 保留 v4.9.1 内置 GCC、clangd、GDB、ICPC/OI、CSP 模拟、AC/WA 音效与 Windows 镜像构建脚本。

**[查看 v5.0 完整更新说明](./RELEASE-v5.0.md)**

## 构建

下载并解压整个源码 ZIP。在 Windows 构建电脑安装 Node.js 22+ 后，执行 `build-windows-mirror.bat`。
这是完整源码和打包工程，不是可直接双击的成品 `.exe`，构建 Windows 客户端时仍需准备完整 GCC/GDB/clangd 和 Electron。

## 测试

```powershell
npm test
```

其中 `submission/` 目录保存新增的本地提交模块；`renderer/editor-prompts.js` 提供纯本地提示词管理。

---

# Yanpb CodeLab v4.9

**最新更新：** [精简工具栏与 AC/WA 声音提示说明](./RELEASE-v4.9.md)

# Yanpb CodeLab v4.7 · 内存 / 磁盘性能优化

这次的目标是减少**无操作时**的 clangd 常驻内存、压缩新生成的代码历史快照、裁剪额外的 clangd 文件，并在构建后输出真实组件体积。**Electron 多进程本身不属于内存泄漏。**

- 详见 [性能优化指南](PERFORMANCE-v4.7.md)
- Windows 构建：Node.js 22+ → `build-windows-mirror.bat` → `dist-windows/`
- 构建过程仍会下载并验证 GCC/GDB、clangd、Electron；最终学生端不需要 Node.js 或系统编译器。

---

# Yanpb CodeLab v4.6.1 · 紧凑数字行号栏

本次调整仅聚焦代码编辑框左侧行号区域，将断点/诊断/折叠从额外的列合并到动态宽度的数字行号栏。具体改动和使用方式见 [RELEASE-v4.6.1.md](RELEASE-v4.6.1.md)。

---

# Yanpb CodeLab v4.6 · 编辑区精简与文件右键菜单

本版建立在 v4.5 上，保留 ICPC/OI 模式切换、编辑器半透明水印、Windows 离线 GCC、GDB、clangd、代码历史、自动保存与比赛系统。

**两项主要变化**：彻底移除编辑区右侧 Minimap；左侧资源管理器和上方文件标签新增右键快捷菜单（中/英双语）。

- [v4.6 完整更新说明](./RELEASE-v4.6.md)
- [原有 v4.5 说明](./RELEASE-v4.5.md)
- [Windows Electron 镜像构建说明](./ELECTRON-DOWNLOAD-FIX.md)

## Windows 安装版构建

下载并解压源码后，Windows 构建电脑需 Node.js 22+。双击 `build-windows-mirror.bat` 或执行 `build-windows.bat`，构建脚本下载和校验需要的 Electron、GCC/GDB/clangd 工具链，生成 NSIS Setup / Portable 免安装 `.exe`。**当前源码 ZIP 没有内置完整工具链和已构建 `.exe`**，这不影响最终安装包的免配置目标。

在现有 v4.5 工程上覆盖 v4.6 补丁也可升级 UI 与文件菜单；删除原 `renderer/editor-surface.js` 属于可选清理，因为新版不再加载它。

## 功能验证

项目 `npm test` 自动验证文件名、重命名避免覆盖、右键入口、Minimap 移除、以及原有 C++ 竞赛功能。部分桌面文件操作（资源管理器打开、回收站）仍需在 Windows Electron 成品上实测。
# Yanpb CodeLab v4.5 · 编辑器场景展示增强版

本版恢复 ICPC/OI 编辑区水印、改进右侧 Minimap 代码概览，并将 ICPC WA/AC 记分从右侧样例栏移至顶部比赛工具；编辑器上方会按自由编程、ICPC 比赛、OI/CSP 和 GDB 调试状态切换。

**[查看本版升级详情](./RELEASE-v4.5.md)**。保留 v4.4.1 的 Electron 超时镜像构建方案，参考 [ELECTRON-DOWNLOAD-FIX.md](./ELECTRON-DOWNLOAD-FIX.md)。

这是源码与 Windows 打包工程，**不包含成品 EXE**。Windows 构建机安装 Node.js 22+，解压后运行 `build-windows.bat` 或 `build-windows-mirror.bat`；成品预期包含离线 GCC/GDB/clangd。Windows 端安装、下载和调试仍需实测。

---

# Yanpb CodeLab v4.4.1 · Electron 下载超时修复版

遇到 `electron-builder connect ETIMEDOUT`、`electron-v38.8.6-win32-x64.zip` 下载失败？请先阅读 **[ELECTRON-DOWNLOAD-FIX.md](./ELECTRON-DOWNLOAD-FIX.md)**。

**推荐：在 Windows 上直接运行 `build-windows.bat`**。修复版先尝试 npmmirror Electron 镜像，失败再回退官方 GitHub。可指定 `-ElectronSource Mirror` / `GitHub` / `LocalZip`，也支持 `-Compact`。GCC/GDB/clangd 内置逻辑和 v4.4 功能均保留。

> 交付为源码工程与打包脚本，不是已编译的 `.exe`。Windows 实机打包仍需用户在 Windows 进行。

---

# Yanpb CodeLab v4.4 · 标准输入 GDB 调试与数据可视化

**新增**：带预设标准输入的 GDB/MI 单步调试、监视表达式、条件断点、数组与 `std::vector` 的逐项显示。保留 v4.3 clangd 语义诊断、本地 GCC、ICPC/OI 及 CSP 模拟。

- 启动 GDB：`F11` → 底部「GDB 调试」页面。先在调试输入框粘贴 `cin` 读取的全部数据（与右侧标准输入同步），再设置断点并启动。
- 监视：在「Watch」输入 `i`、`dp[i]` 等，暂停时向 GDB 读取真实值；最多 16 个监视表达式。
- 条件断点：先点击代码行号设置断点，在调试面板给行号设置条件，例如 `i == 5`。只有暂停状态下才能修改当前 GDB 会话中的条件。
- 数组可视化：输入数组/向量名称 `a`、`dp`、`f[i]`；指定起始下标和数量（最多 40），下次暂停时读取 `a[0]` 等表达式，显示数字条形图和原始值。每次暂停总共最多采样 80 个元素。超出有效下标或变量优化消失时会显示 GDB 错误，而非虚构数值。
- 普通调试快捷键：`F11` 启动、`F10` 单步跳过、`F12` 继续；面板提供单步进入、跳出函数和停止。

**标准输入限制**：本版本支持在启动前预加载不超过 256 KB 的输入文件，然后在同一 GDB 会话中断点、单步、读取变量。**暂不支持程序运行期间动态追加终端输入**。GDB 通过 `run < yanpb-debug-input.txt` 进行输入重定向，不会把样例内容作为 MI 控制命令执行。Windows GDB 不提供与 Unix PTY 相同的终端能力；因此 Windows 最终可用性仍须实测。

**注意**：表达式在 GDB 进程里按 C++ 求值，可能有副作用；只调试自己的可信代码。调试以 `-O0 -g` 构建，不等于正式 OJ 的优化评测。调试时数组显示不代表动态规划证明或时间复杂度验证。

## Windows 打包

本 ZIP 是可构建的源码工程，**不是安装后的 `.exe`**。在 Windows 10/11 x64 配置 Node.js 22+，解压并运行 `build-windows.bat`。构建脚本负责下载校验完整 GCC/GDB 和 clangd 运行时，安装版学生电脑无需自行配置 PATH。

## 验证

执行 `npm test` 运行 104 项原有与新增测试，包括 v4.4 监视、输入命令、条件断点、数组限制的新测试。当前环境没有 GDB，因此 **GDB 的实际断点和 Windows stdin 重定向尚未进行真实进程端到端验证**；协议解析与模拟会话已测，不应当作 Windows 调试已通过。

详细用法见 `RELEASE-v4.4.md`。

---

# Yanpb CodeLab v4.3｜实时 clangd + 交互式 GDB

[完整功能、快捷键、构建及限制说明](./RELEASE-v4.3.md)

**新增：** CodeMirror 代码行内实时 clangd 诊断、F11 启动 GDB/MI 断点调试、F10 单步与 F12 继续、变量与调用栈面板。保留 v4.2 全部主要功能。

**安装：** 这份源码工程还不是可安装的 Windows `.exe`。Windows 10/11 x64、Node.js 22+ 环境下运行 `build-windows.bat`；首次构建会联网下载并校验 WinLibs GCC/GDB 和 clangd，再生成离线安装版。

---

# Yanpb CodeLab v4.2 — Local Competitive Programming IDE

**纯本地 Windows C++ 竞赛 IDE**，支持 ICPC/OI、CSP-J/S 模拟考试、Competitive Companion 样例导入、离线 GCC/GDB、对拍、2 秒自动保存、代码时间线及个性化设置。

## v4.2 — 更专注的资源管理与代码区

- 左侧栏不再放样例输入，不再展示运行记录导航与提示；仅展示文件、模板、比赛以及打开/新建和文件筛选。
- 右侧「测试样例」完整管理样例输入、预期输出，支持一键复制输入到标准输入框。
- 代码编辑器基于已内置的开源 CodeMirror（MIT）优化视觉及代码缩略图（Minimap），无需云端 CDN。DIY 可关闭缩略图。
- 底部新增 **问题 / Problems** 面板，汇总编译错误及警告；支持定位源码行、保留完整原始编译日志和谨慎的分号修复预览。
- 编译途中修改文件后不会错误地把旧诊断贴到新源码上。

**详细功能及测试说明：[RELEASE-v4.2.md](./RELEASE-v4.2.md)**。

## 编译 / 比赛 / 快捷键

| 功能 | 操作 |
|---|---|
| 编译运行 | `F5` / `Ctrl+Enter` |
| 运行全部样例 | `F7` / `Ctrl+Shift+Enter` |
| 切换 ICPC/OI | `Alt+1` / `Alt+2` |
| 模板展开 | `Ctrl+J` |
| 代码查找 | `Ctrl+F` |
| 打开文件、保存 | `Ctrl+O`、`Ctrl+S` |
| 新建比赛 | `Ctrl+Shift+N` |
| CSP 复赛文件检查 | `F8`（仅 CSP 比赛适用） |
| 对拍 | `F9` |
| 变量追踪 | `F10` |
| 展开/折叠侧栏 | `Ctrl+B` / `Ctrl+Alt+R` |
| 代码历史版本 | `Ctrl+H` |

## Windows 免配置安装程序构建

本 ZIP **仅是完整源码工程，并非已经生成的 Windows `.exe`**。

在 Windows 10/11 x64 构建机先安装 Node.js 22+，解压后执行：

```powershell
.\build-windows.bat
```

构建脚本准备内置 GCC/GDB（首次需要网络），校验并打包 Electron，随后输出安装版与 Portable 免安装版。生成的完整学生版本无需学生再安装 GCC / Node.js。**Windows EXE 的真实安装、权限和 GDB 调试仍需 Windows 机器最终验收。**

## 自动化测试

```bash
npm test
```

本版本在当前 Linux 环境 89/89 项自动测试通过，并进行 Chromium 界面交互检查。程序运行不提供安全沙箱；只执行自己编写或可信的 C++ 代码。

## 历史版本资料

历史功能详见 `RELEASE-v4.1.md`、`RELEASE-v4.0.md`、`RELEASE-v3.9.md`、`CONTEST-CSP-GUIDE.md` 等文件。历史文档保留当时功能说明，**当前界面行为以 v4.2 文档为准**。

作者：Yanpb
