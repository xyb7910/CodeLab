# Yanpb CodeLab v5.10.3 — 浏览器显示 AC 但 IDE 未同步：修复与排查

## 本次修复

- **动态更新漏报**：AtCoder/洛谷的具体 Submission 详情页仅更新 DOM（`Judging → AC`）时，浏览器扩展用受限 `MutationObserver` 通知后台重新读取结果；不需要官网再次跳转 URL。
- **Chrome MV3 休眠漏报**：浏览器扩展重新唤醒后，每次扫描已观察的官方标签页 URL；即使跳转事件发生在后台休眠期间，也能恢复实际官方详情页的 ID 与状态。保留 30 秒闹钟作为后台轮询兜底。
- **先完成跳转再启动监听**：AtCoder/洛谷只在官方详情页提供**唯一**的题目身份和状态、且与当前排队任务唯一匹配时才关联 Submission ID。无法证明则仍保持待核对，绝不按“列表第一条”猜测。
- **URL 查询参数**：官网详情页的 `?lang=...` / `#...` 不再导致状态被忽略，仍需匹配同一个官方域名和 Submission 路径。
- **不回退判题**：一个已经核实的 AC/WA 不会被旧页面缓存的 Judging 覆盖。
- **重启时恢复显示**：CodeLab 会重新读取当前登录账户的待核对/已核对任务；Codeforces 用户须先在 Settings 配置正确的 handle，才能通过官方 `user.status` 自动核验。
- **可观察诊断**：Chrome/Edge 扩展 v1.3 显示监听任务数和最近一次成功回传的官方状态，帮助区分“没有绑定任务”和“已有结果但界面未刷新”。

## 安装（旧版不能只更新一端）

1. 更新 CodeLab 的 v5.10.3 源码并在 Windows/macOS 上重新构建、安装；已有源码可使用 `v5.10.2 → v5.10.3` 覆盖补丁。
2. 打开 `chrome://extensions` 或 `edge://extensions`，**移除旧版 Yanpb OJ Result Bridge**，然后打开开发者模式，加载 v1.3.0 扩展解压目录（选中包含 `manifest.json` 的文件夹）。普通 Competitive Companion 可以保留。
3. 在 CodeLab **更多工具 → OJ 浏览器连接** 重新生成 6 位授权码；在浏览器扩展中输入并连接。
4. 保持 CodeLab 运行，点击 **浏览器提交**，在官网完成提交。打开该次具体的 Submission 详情页（AtCoder `/submissions/数字`，洛谷 `/record/数字`），等待 AC/WA 确认；**仅停留在提交列表并不能安全确定具体题目对应的记录**。
5. 检查扩展：`✓ CodeLab 已连接`、`当前监听 N 条`、`最近同步：ATCODER · AC · 时间`；IDE 应显示官方 AC/WA 提醒。

**Codeforces 专项**：在 CodeLab Settings 中填写本人的 Codeforces handle。扩展负责发现 Submission ID，CodeLab 使用官方 `user.status` API 严格匹配 ID、比赛、题号后才显示官方 AC。

## 出问题时优先对照

| 症状 | 可能原因与处理 |
|---|---|
| 扩展显示“本机桥接不可用” | CodeLab 未启动，或 127.0.0.1:10045 被占用；Windows 用 `Test-NetConnection 127.0.0.1 -Port 10045` |
| 扩展显示“已连接，当前监听 0 条” | IDE 尚未准备监测任务；从 CodeLab 中点击「浏览器提交」，确保题目网址正确 |
| 监听有任务、Submission ID 未回传 | 当前只打开了提交列表、网页跳转没有被识别，或题目身份不明确；请打开本次具体提交详情页，再点击扩展「检测连接并同步判题」 |
| Submission ID 已识别，官网 AC，但 IDE 仍待核对 | AtCoder/洛谷详情页缺少可识别的唯一 Task + Status；扩展会显示具体错误，不会捏造 AC。重载具体详情页并尝试扩展手动同步。 |
| Codeforces 官网 AC 但 IDE 一直等待 | 确认 Settings 的 handle 正确、Submission ID 匹配、网络能够访问官方 API；官方有限频要求。 |
| 已连接却突然停更 | 浏览器后台工作进程休眠、CodeLab 重启或超出 6 小时监听期限。打开扩展重试；必要时从 IDE 重新准备监听。 |

## 安全边界

- 扩展不会自动提交源码、不会读取密码或绕过验证码。它只观察用户打开的官网页面。
- **只有来源、Submission ID、比赛和题号都可验证时**，IDE 才把网页状态升级为“官方已核对”。
- 真实 Codeforces、AtCoder、洛谷官方页面仍可能更新结构；无法正确提取时，应提示待核对，不会默认 AC。
- 本版已在本机用 Chromium 扩展后台模拟和实际本地 HTTP 桥接验证；**Windows/Mac 三站点在线真实提交的端到端实机验收仍未完成**。
