# Yanpb CodeLab v5.3 — 比赛极速远端提交（Fast Contest Submit）

## 产品目标

**尽量减少用户重复操作，同时保证不提交错题、不冒充官方判题、不绕过登录和验证码。**

目前快捷键：`Ctrl + Shift + U`；顶部新按钮：**极速 OJ**。

从 CPH 导入后，当前 `.cpp` 已关联 OJ 题目网址，点击极速 OJ 即可自动识别 Codeforces / AtCoder / 洛谷。非 CPH 文件可手动粘贴网址。

## 真实流程

```text
当前源码 + 当前 OJ 题目 URL
           |
           v
  本地冻结 .cpp 和 SHA-256
           |
           +--> 防止 90 秒内同题、同源码重复准备
           |
           v
  CodeLab 内打开官方 HTTPS 提交页面
           |
           +--> 自动填入源码（可能需要先登录）
           +--> CF / AtCoder 有匹配的题号下拉框时精确选择
           +--> 题号不存在就提示，不填错题
           |
           v
  用户检查语言/题号/账号/验证码，点击官方提交按钮
           |
           v
  官方页面产生 Submission ID
           |
           v
  CodeLab 关联官网提交详情 URL
           |
           +--> Codeforces: 用 handle + 只读官方 API 核对比赛/题号/记录号
           +--> AtCoder: 读官方详情页状态，但缺少题号核验时保留 UNVERIFIED
           +--> 洛谷: 读官方详情页状态，但缺少题号核验时保留 UNVERIFIED
           |
           v
  本地提交队列更新状态，保留原始源码快照
```

## 四个必须独立的概念

| 概念 | 证据 | 软件状态 |
| --- | --- | --- |
| 代码准备好 | 本地保存快照 | prepared |
| 官方表单已填写 | OJ 页面控件确认填入 | form_filled |
| 官方提交已出现 | 官网返回 Submission ID / 详情页 | receipt_pending |
| 判题结果 | 对应官网详情或只读官方 API | judging / verified / unverified |

只有能和 **同一题目 + 同一官方记录** 严格匹配的结果才会标记 `verified`。当前 Codeforces 可严格匹配比赛号、题号和 submission ID；AtCoder/洛谷详情页识别仍可能无法自动匹配题号，因此明确保留 `unverified`，绝不将其自动合并为正式 AC。

## 对选手的使用方法

1. 将题目通过 CPH 导入 CodeLab，写完 `A.cpp` 后直接 `Ctrl + Shift + U`。
2. 系统自动带入题目网址；点击「冻结源码并打开官网表单」。即使此后切换到 B.cpp，A 题快照也不会改变。
3. 在 CodeLab 内嵌 OJ 官网窗口中登录，检查题号与语言后**亲自点击提交**。自动填充失败时按官网窗口 `Ctrl + Shift + Enter` 重新填入；也可复制源码手动粘贴。
4. 如果官网导航到了官方详情页，会尝试自动识别 Submission ID；否则在极速提交窗口填写官网记录链接。
5. Codeforces 填写 handle，点击「查询官方判题」。网站限频要求 2 秒以上，本工具按不少于 2.3 秒控制。AtCoder、洛谷需在官网窗口打开提交详情后查询。
6. 一旦切到下一题，提交队列仍保留所有任务和原源码，支持「重新打开官网」以继续处理旧题。

## 使用限制与平台差异

### Codeforces

Codeforces 公开 API 提供 `user.status` 和 `contest.status` 读取提交记录，但没有公开的标准「提交源码」API。因此 CodeLab 使用官网提交页面填表，由选手最终确认。官方状态核对需要 handle 和有效的官方提交详情 URL，**不能只根据“最近一条提交”猜测是哪一题**。

- 公开 API: https://codeforces.com/apiHelp/methods
- 请求频率: https://codeforces.com/apiHelp

### AtCoder

在登录后的官方 `/contests/{contest}/submit` 页面填入源码；如任务下拉框包含精确 task ID，则自动选择，否则暂停自动填入并提醒核对。最终由选手在官网提交。当前 DOM 详情页状态只能证明看到了某条记录，不足以可靠归因到具体 CodeLab 源文件，故默认标记为 `unverified`。

### 洛谷

普通用户继续使用官网登录和题目提交控件；具备洛谷开放平台 OpenApp 授权的开发者可后续增加官方 API 适配，但它与普通用户个人题目提交不是同一业务，不能混淆。当前本地记录只有官网具体提交详情链接才可尝试读取结果。

- 开放平台: https://docs.lgapi.cn/open/
- OpenAPI: https://docs.lgapi.cn/open/openapi

## 安全与性能

- HTTPS 官方域名白名单。OJ 网站在隔离 Electron BrowserWindow 中打开，禁用 Node 集成、开启沙箱；CodeLab 不收集 OJ 密码、会话 Cookie 或验证码。
- **不会自动点击提交按钮、猜测 CSRF Token 或绕过验证码。** 未获得真实官方判题证据不得显示 AC。
- 每次准备提交都会将源码冻结到本机用户数据目录 `oj-fast-submit/{UUID}.cpp`，以 `ledger.json` 保存元数据；最近最多保留 80 份记录，不上传到第三方服务。
- 相同题目、完全相同源码 90 秒内重复点击复用准备任务；要真的再次提交，请使用官网按其规则操作。这个限制仅作用于本地任务队列，不修改远端 OJ 行为。
- 目前并未实测 Windows 上三大 OJ 的真实登录—提交—判题全流程；网站改版、验证码、平台限流都可能要求更新适配器。
- 本次不把“少点击”量化为固定秒数。验收时建议记录每道题从点击提交到官网受理所花时间、题号匹配准确率、误填率、结果回传延时。

## Windows 构建

下载完整源码压缩包，Windows 构建电脑安装 Node.js 22+ 后运行 `build-windows-mirror.bat`。完整的离线 GCC/GDB/clangd 工具链仍按既有流程准备。这里提供的 ZIP **不是 Windows 安装程序**。

## 未来增强（需平台合规验证）

1. 给 AtCoder/洛谷增加能够严格识别官网详情题号的专属适配器，使 `unverified` 能安全升级到 `verified`。
2. 允许官方页面将真实提交 ID 及判题变更推送到 CodeLab，并严格做账号/比赛/题号匹配。
3. 只对开放平台正式允许的 API 实现直接提交；未获授权的平台继续采用官方网页确认。
