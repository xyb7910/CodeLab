# Yanpb CodeLab v5.1 · OJ 提交助手 + C++ 智能补全

此版本继承 v5.0：离线 GCC/GDB/clangd、ICPC/OI、CPH 样例抓取、CSP 考场、本地样例提交、代码历史、2 秒自动保存、诊断提示与 DIY。

## 1. 官方 OJ 提交流程（谨慎区分本地与在线）

**Competitive Companion 原扩展只负责题目、样例导入；并无覆盖其所有 OJ 的统一官方提交 API。** v5.1 增加了 CodeLab 的 OJ 提交助手及可选 Chrome/Edge 浏览器扩展。该扩展旨在**把源码填入网站的提交页面，最终点击「提交」仍由学生本人完成**。CodeLab 不保存任何 OJ 账号密码、Cookie 或网站会话，也不冒充在线 AC / Accepted。

**支持范围：**

| OJ | 从 CPH 导入 | 跳转/填表支持 | 最终提交 |
|---|---|---|---|
| Codeforces | ✅ | 支持识别 `contest/ID/problem/A` 与 `problemset/problem/ID/A`，打开官方 contest submit 页面；可选扩展辅助填源码 | 在网站手动确认 |
| AtCoder | ✅ | 支持 `contests/ID/tasks/TASK`，打开官方 submit 页面；可选扩展辅助填源码 | 在网站手动确认 |
| 洛谷 | ✅ | 支持 `problem/Pxxxx` 等，打开题目页；网站编辑器若非普通 textarea，可能需要手动粘贴 | 在网站手动确认 |
| 其他 CPH 支持网站 | 取决于 Competitive Companion | 复制源码并在经确认的题目链接中手动查找提交入口 | 在网站手动完成 |

本功能在源码中没有实现任何官方评测平台的自动发包、模拟登录或绕过验证码。网站 DOM 随时可能变动，**浏览器填表是尽力而为**，请核对题目、编译器语言、代码和是否成功提交。

### A. 不安装额外扩展（所有 OJ 都可采用）

1. 从浏览器使用 Competitive Companion 导入题目，或在 CodeLab 中手动填入题目 URL。
2. 选中 `.cpp`，点击上方「提交 OJ」，或 **Ctrl + Alt + U**。
3. 点击「准备网页提交」。复制当前完整源码。
4. 点击「打开官方提交页面」（对不认识的域名，先阅读确认提示）。登录官网，将源码粘贴到表单并自行选择编译器与提交。
5. 登录、验证码、提交结果都在 **OJ 官方网页** 发生；不是 CodeLab 的本地样例历史。

### B. 使用随安装包分发的浏览器辅助扩展（Chrome / Edge）

1. 在 CodeLab「提交 OJ」对话框，点击 **「打开浏览器辅助扩展文件夹」**。完整版 Windows 安装包将扩展放在 `resources/oj-browser-extension/`。
2. 浏览器进入 `chrome://extensions` 或 `edge://extensions`，开启开发者模式 → **加载已解压的扩展程序** → 选择 `oj-browser-extension` 文件夹。无需使用第三方登录工具。
3. 在 CodeLab 准备提交，复制 24 位配对码。打开对应 OJ 的**官方提交页面**并先登录。
4. 点击浏览器的 **Yanpb CodeLab · OJ Submit Helper** 图标，输入配对码，点击「将源码填入当前网页」。
5. 核实所选题目、语言（例如 GNU G++17）、源码后，**自己点击网站提交按钮**。

扩展通过 **`127.0.0.1:10044` 回环地址**读取准备好的源码，仅接受 `chrome-extension://` / `moz-extension://` 来源的一次性配对请求，配对码 3 分钟失效且一次领取后立即作废。程序不将源码提交到 CodeLab 服务器。

**技术限制**：是否能自动填代码由 OJ 页面结构决定。网站使用复杂编辑器、对浏览器扩展有限制或升级表单时，请退回复制粘贴流程。Codeforces、AtCoder 与洛谷的表单路径及填表逻辑**尚需 Windows Chrome/Edge + 真实登录网站验收**。本次没有声称已在真实网站完成线上提交。

## 2. 变量 / 类型 / 函数自动提示

CodeMirror 编辑器增加本地补全：

- **Ctrl + Space** 主动唤出变量及关键字建议；连续输入 2 个以上英文字母时也会尝试弹出。
- clangd 已启动时使用 **LSP `textDocument/completion`**，显示标识符和 clangd 提供的类型等 `detail` 信息。
- 智能省电模式下 clangd 尚未就绪时，先用本地 C++ 标识符扫描补全（如 `int score`、`vector<int> dis`），随后语言服务可继续提供语义建议。
- 忽略修改代码前发出的过时语义补全，避免把旧文件的变量提示插入到新文件。
- **Settings → 代码编辑器 → C++ 变量与类型智能提示** 可单独关闭；与 clangd 的「智能 / 常驻 / 关闭」策略独立控制。

自动补全是编写辅助，不是 C++ 正确性的保证。仅内置 GCC 的编译政策不变。

## 3. 质量验证

- 新增协议与路由测试：已知 OJ URL、拒绝危险 URL、源码大小、一次性配对、跨站来源控制、扩展打包检查。
- 新增补全测试：本地变量识别、clangd 响应映射、版本过期过滤，**真实 clangd 完成局部变量 `sampleValue` 补全**。
- Chromium 界面模拟测试：CPH 导入后提交入口、官方 URL、一次性码、`Ctrl + Space` 补全、Settings 开关，无脚本异常。

**Windows 限制**：本次交付为源码及 Electron 安装包构建工程，不是已构建/实测的 Windows `.exe`。正式发布前应在 Windows 电脑上逐个验证 Codeforces、AtCoder、洛谷的登录网页与浏览器辅助扩展。

## 4. 构建

构建机：Windows 10/11 x64、Node.js 22+，首次构建需要下载 Electron、GCC/GDB/clangd。解压工程并双击 `build-windows-mirror.bat`。生成的 Setup / Portable 程序会包含 OJ 浏览器辅助扩展文件夹。学生电脑无须自行安装 GCC，但选择自动填表时仍需自己在浏览器加载扩展并登录 OJ。
