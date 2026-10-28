# Yanpb CodeLab v5.4 · 官方 Submission ID 自动识别

本版本基于 v5.3 的 Fast OJ Submit 队列、内嵌 OJ 官网窗口升级，保留 ICPC/OI、GCC/GDB/clangd 和原有离线功能。**当前交付的是完整源码及 Windows 构建工程，不是现成 .exe。**

## 实际工作流程

1. 在 CodeLab 中导入 Codeforces / AtCoder / 洛谷题目，写好 C++ 源码。
2. `Ctrl + Shift + U` → 冻结源码并打开官网表单（快照含 SHA-256、比赛、题号和文件身份）。
3. 用户在官网登录、核对语言/题号、人工确认提交。软件不提交表单，不绕过验证码。
4. **当内嵌官网发生网页跳转：**
   - 跳转到确定的官方提交详情：从详情 URL 自动解析官方 Submission ID；验证官网域名、比赛 ID，尝试从详情页面核实题号。身份充分时在本地任务队列预关联 ID，状态仍是 **待官方核对**。
   - 跳转到「我的提交」或「提交列表」：扫描官网列表中的提交详情链接以及同一行的题目链接，提取**候选 Submission ID**，过滤不同平台/比赛/题目。即使只有一条匹配的列表记录，也不猜测它一定来自本次源码，用户可以在 CodeLab 的候选列表点击选取。
5. 核对官方判题：Codeforces 输入 handle，使用官方 `user.status` 接口按确切提交 ID、比赛 ID、题号核对；AtCoder / 洛谷仅在官网详情页提供清晰的题目身份和状态时确认结果，否则保持「未核实」。

## 安全设计

- 直接官网跳转只有在本地冻结源码任务已完成表单填充、30 分钟内且没有已有其他绑定记录时才可能自动预关联。
- 仅提取官网提交详情 URL/ID/题目链接；不读取浏览器 cookies、密码、验证码和 CSRF token，也不会绕过官方要求。
- 状态 `receipt_pending` 表示识别到 ID，但**绝不表示官方已接收本次冻结源码**；若用户在官网手动修改代码，本地 SHA-256 仅对应冻结快照，无法证明二者一致。
- `verified` 只表示已读取且核对过官方记录/题目，不是对源代码哈希的官方证明；并不保证该记录对应当前本地版本。
- 多条候选记录/缺失题号/跨比赛/非官网跳转均不自动绑定。旧版粘贴详情 URL 仍保留作为备用。
- 不会自动点击最终提交按钮，也不会向公开查询 API 发起高频并发请求。

## 使用边界

- 支持 `https://codeforces.com/contest/<id>/submission/<id>`、`/problemset/submission/<contest>/<id>`、`https://atcoder.jp/contests/<contest>/submissions/<id>`、`https://www.luogu.com.cn/record/<id>` 等详情地址。
- 网站的登录/提交页结构可能更改，列表 DOM 读取属于尽力适配，不能保证每次都自动发现；无法辨认时可以选取候选或手动复制记录 URL。
- 尚未完成真实 Windows 客户端在这三个网站上的登录、正式提交及判题端到端验证；不要将本地模拟界面当作线上测试。
- Codeforces 官方 API 文档：https://codeforces.com/apiHelp/methods 。

## 构建

Windows 10/11 x64 的构建电脑需要 Node.js 22+；解压后运行 `build-windows-mirror.bat`。在交付学生之前，分别在三个目标 OJ 上使用独立测试账号完成官网页面识别的实机回归，并遵守各平台对自动化和比赛辅助工具的相关规则。

## 开发验证

`npm test` 验证原有功能 + Submission ID 格式识别、跨平台/跨比赛拒绝、多候选不自动绑定、详情页自动预关联、过期任务不自动预关联、Codeforces/AtCoder/洛谷的官方题号核对等行为。
