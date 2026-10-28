# Yanpb CodeLab v4.3｜clangd 实时语义诊断与交互式 GDB

基于 v4.2 原工程升级。保留 ICPC/OI 切换、CPH、比赛目录、CSP 检查、代码历史、模板、2 秒自动保存及 CodeMirror 编辑器。以下功能无需登录云端账户。

## 1. clangd：真正的本地 LSP 语言服务

- Windows **安装版与免安装版会打包 clangd 22.1.6**，不是依赖学生另行安装 LLVM。
- 从官方 [clangd](https://github.com/clangd/clangd/releases/tag/22.1.6) Windows x64 standalone 发行版下载、校验 SHA-256（见 `scripts/install-clangd.ps1`），然后由 Electron-builder 以 `extraResources` 内置。
- 桌面 IDE 启动后自动创建临时 clangd 编译数据库，使用选中的 GCC（`--query-driver`）获取标准库搜索路径。将 CodeMirror 当前源码通过 LSP `didOpen`、`didChange` 提交到**本机进程**，默认输入停止后约 430ms 发起更新。
- 在编写过程中显示行号、列号、错误和警告；编辑源码后清除过期诊断，检测结果进入原有「问题」面板并可跳到具体源码位置。GCC 构建错误仍独立保留在编译日志。
- 状态栏实时显示 `clangd LIVE` / `clangd unavailable`。如工具链未打包完整，会明确提示而不伪装为语义诊断已启动。
- 单个活动源码窗口接受独立诊断版本；切换文件会重开语言文档。暂不包括全工程跨文件索引及重构功能。

## 2. GDB/MI 交互式断点调试

在编辑器**点击代码左侧行号 / 红色断点槽**添加断点，再按 `F11` 或点击编辑器顶部闪电图标启动。底部打开「调试器 GDB」页。

- 使用配套 GCC `-O0 -g` 编译当前源码为独立可执行文件，并启动真实 GDB/MI 进程。
- 断点命中时：高亮当前执行行；读取局部变量值和调用栈；显示调试消息。
- `F10` 单步跳过（调试时）；`F12` 继续；也可以点「单步进入」「跳出函数」「终止」。
- 调试过程中不以“预测变量值”替代 GDB 实际信息。与旧版批量变量追溯相互独立；旧功能从“版本与调试工具”菜单访问。
- **当前交互式 GDB 暂不支持含 `cin` 的标准输入重定向**，请对无输入代码进行调试，需自定义输入时使用普通编译运行或旧版批量变量追踪。未来可以通过 Windows PTY/ConPTY 支持交互输入。
- 断点仅在当前会话内保存；每个打开的文件有独立断点集合，切换文件会结束旧会话以避免错误定位。单次 GDB 最长约 120 秒；不会影响普通运行器已有的时间限制。

## 3. 构建 Windows 免配置 EXE

源码 ZIP **不包含二进制 `.exe`、WinLibs GCC 或 clangd**；首次 Windows 构建需要联网准备依赖。Windows x64 安装 Node.js 22+，双击 `build-windows.bat`：

1. 下载、校验 WinLibs GCC/GDB 发行包；
2. 下载官方 clangd 22.1.6 Windows x64 ZIP，严格 SHA-256 校验；
3. 运行 `npm test`；
4. 编译器文件精简、Windows GCC/GDB 编译/调试冒烟验证、clangd `--version` 验证，失败则停止打包；
5. `electron-builder` 生成安装版和免安装版。

安装后 IDE 使用内置 GCC、GDB、clangd，不需要系统 PATH 或网络。clangd 会使程序体积比 v4.2 **略有增加**；没有未经测量的缩减承诺。

## 4. 验证边界

- 当前环境有真实 clangd 17：已通过标准 LSP 初始化、从源码获取未声明变量诊断、编辑后诊断消失的自动测试。
- GDB/MI 的消息解析、局部变量、调用栈及断点事件通过模拟协议测试；**没有 Windows GDB 实机联调**，不代表全部调试场景已验收。
- Chromium 界面通过了 clangd 问题展示、GDB 面板和变量展示的交互测试。
- Windows 安装包尚未在当前环境生成及验收。

### 调试安全与资源限制

调试和运行**自己或可信来源**的 C++ 程序；本机 GDB 不提供安全隔离。语义诊断仅检查所提供的当前源码及编译参数；错误提示可能与 GCC 或正式 NOI Linux 评测环境略有差异。

作者：Yanpb
