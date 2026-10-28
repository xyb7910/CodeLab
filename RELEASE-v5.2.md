# Yanpb CodeLab v5.2 · 内嵌官方 OJ 提交与判题回传

## 修复 v5.1 图片所示的问题

旧扩展依赖 `127.0.0.1:10044` 暂存源码和 24 位一次性配对码。源码 3 分钟失效；被正确配对领取后立即清空。扩展将 HTTP 403（无效）和 HTTP 410（失效/已领取）合并提示为“配对码错误、已使用或已过期”，故单凭截图无法分辨哪种情况。另一个问题是：源码被领取后，填表失败不能重新领取。

v5.2 改为 **CodeLab 应用内的官方 OJ 网站窗口**。提交不再需要安装扩展，也不需要配对码、固定端口或跨浏览器复制登录信息。旧浏览器扩展可以停用/卸载；v5.2 安装包不会再携带它。

## v5.2 使用方法

1. 在 CPH 导入题目后，打开当前 `.cpp`，点击顶部 **更多 → 官方 OJ 工作台**（快捷键 Ctrl + Alt + U）。
2. 检查题目网址，点击 **在 CodeLab 内打开 OJ**。出现对应 OJ 的应用内网站窗口。首次使用时请**直接在官网窗口登录**。各网站的 Cookie 分别保存在 Electron 的独立会话中，不会发送到 CodeLab 的文件、插件或本机测试服务；不抓取 Cookie/密码/验证码。
3. 进入官网的提交表单后，返回 CodeLab 工作台点 **填入当前代码**，或在官网窗口按 **Ctrl + Shift + Enter**。如果网站修改了源码编辑器 DOM，可能无法填入；此时使用工作台中的「复制源码」并在官网窗口粘贴即可。
4. **检查题号、C++ 语言、源码，再由用户在官方网页确认提交**。软件不会绕过 CAPTCHA、也不会静默代替你点击网页“提交”。
5. **获取官方判题结果**：
   - Codeforces：填入 Codeforces handle；在官网获取真实提交详情链接（形如 `https://codeforces.com/contest/1976/submission/12345`），点击 **读取官方判题结果**。利用公开 `user.status` API 查询，验证提交 ID 和比赛 ID 相符；如果 API 不可用、记录超过最近 100 条或 ID 不匹配，显示未确认。打开详情页并已填写 handle 时也会尝试查询。
   - AtCoder：进入官网的具体 `https://atcoder.jp/contests/abc371/submissions/12345` 详情页面；软件尝试从页面可见的评测状态自动同步。也可粘贴详情链接再点击读取。
   - 洛谷：进入官网的具体 `https://www.luogu.com.cn/record/12345` 详情页面；软件尝试读取可见判题状态。也可粘贴详情链接查询。
6. **“本地样例通过”与“官方 AC”必须分开**。只有来源于真实官方提交 ID 和状态的数据才会标为“官方”，没有查到的状态一律显示未确认。

## 平台限制（重要）

Codeforces 官方 API 提供提交状态查询，不提供公开的通用代码提交接口；AtCoder 可能要求 CAPTCHA，并明确不支持非官方提交工具；洛谷的正式评测 API 需要开放平台授权，部分服务限量邀请。为保证账号安全与平台合规，v5.2 通过**官网页面进行最终提交**，并未实现无人值守的后台自动 POST。需要登录、选语言、验证码时请在官网窗口手动操作。

“无需切换浏览器”指无需另外打开系统 Chrome/Edge，也无需安装原来的配对扩展。应用内仍会打开一个官方网页子窗口，受 OJ 官方登录/提交规则约束。

官网网站未来改变编辑器控件、状态页面 DOM、账号认证方式时，自动填表和解析可能失效；软件会提示“未验证”，且保留官网原页面供核对。Windows + 三个 OJ 的真实在线提交端到端测试尚未完成。

## 安全设计

- 只允许 `codeforces.com`、`atcoder.jp`、`luogu.com.cn` 的 HTTPS 官方域名；非白名单站点无法自动填代码或读取判题。
- 官方窗口开启 Electron `sandbox`、`contextIsolation`，关闭 Node 集成；各平台使用独立持久会话。
- 只在用户明确选择“填入当前代码”后，向该官方页面交付编辑器代码；绝不读取网站密码、会话 Cookie 或绕过验证码。
- 没有自动点击提交按钮，不能将页面加载成功/本地测试通过视为官方提交成功。
- Codeforces API 使用公开账号 handle 查询并限制频率，不收集 API secret。
- `oj/browser-extension` 目录保留为旧版兼容源码，不再打包至 Windows 客户端；建议移除已经安装的 v5.1 浏览器扩展。

## 构建与测试

```powershell
npm test
.\build-windows-mirror.bat
```

构建 Windows 成品需要 Node.js 22+、Electron 下载和内置 GCC/GDB/clangd 工具链准备。**源码 ZIP 不包含已打包好的 `.exe`**。本环境完成源代码自动测试与 Chromium 前端模拟，官方网页登录、网页提交及真机 Chrome/Edge 兼容性仍需要 Windows 现场验收。

官方参考：
- Codeforces 官方 API: https://codeforces.com/apiHelp/methods
- AtCoder CAPTCHA/Unofficial Tools: https://atcoder.jp/posts/1457?lang=en
- 洛谷开放平台介绍: https://help.luogu.com.cn/about-us
- Competitive Companion: https://github.com/jmerle/competitive-companion
