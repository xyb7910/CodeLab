# Yanpb CodeLab v5.10.1｜浏览器连接与官方判题回传修复

适用：Windows / macOS，Chrome / Edge，Codeforces / AtCoder / 洛谷。

## 为什么旧版会出现“未连接”或“没有收到判题结果”？

1. 扩展重装或换浏览器后 ID 变化：CodeLab 保留旧的配对凭据，旧版不能直接用新 PIN 重新授权。
2. 浏览器的 Manifest V3 后台会休眠，旧版只靠内存保存监听任务，CodeLab 重启后可能拒绝原标签回传的提交记录。
3. CodeLab 和扩展都可能打开提交标签页，学生在其中一个标签提交，扩展却监听了另一个。
4. 10 分钟监听期限偏短，AtCoder / 洛谷的部分正式评测可能尚未结束。
5. AtCoder/洛谷的判题信息可能位于详情页表格的 Status/评测状态行，旧版仅检测少量 CSS 选择器。
6. 旧版扩展弹窗显示的是上一次保留的状态，未主动向 CodeLab 查询当前连接状态。

## v5.10.1 修复内容

- 扩展版本 `1.2.0`，允许用户从 CodeLab 主动重新生成 PIN，在配对成功时安全轮换旧授权。配对 PIN 最多 5 次错误尝试，5 分钟过期。
- 新增已授权的本地 `/heartbeat`，扩展按钮可明确显示是否真的连接 127.0.0.1:10045、等待任务数及错误信息。
- 监听任务延长至 6 小时；待监测的任务标记写入本地提交台账。CodeLab 重启时恢复最近最多 12 项尚未完成的监听，以及已关联的官方记录状态。
- **监听任务绝不再新开第二个浏览器标签**。只跟踪 CodeLab 通过系统浏览器打开的真实提交页；若标签稍后才打开，扩展可自动附着。
- Chrome/Edge 后台工作进程休眠前的待附着任务保存在 `chrome.storage.session`；恢复后继续跟踪标签。仍保留官方最低 30 秒周期闹钟，不能保证毫秒级实时推送。
- 浏览器标签临时加载失败时，可有限次数重新领取监听任务；页面信息校验失败仍拒绝把不相关题目判为 AC。
- AtCoder/洛谷详情页增加 `Status`、`Task/Problem` 表格行解析；同时检查 **唯一明确题目链接** 和提交记录 ID，信息不足则保持“待核验”。
- Codeforces 按照官网公开的 API 查询结果，需在 CodeLab Settings 填写 Codeforces Handle。
- 保留两个端口：Competitive Companion 题目导入 **10043**；Yanpb OJ Result Bridge 官方结果监听 **10045**。这两个扩展不能互相替代。

## 必须同时更新桌面端与扩展

1. 使用完整工程构建 v5.10.1 Windows / Mac 版；或解压升级补丁到原 v5.10 源码根目录，重新构建。
2. Chrome 打开 `chrome://extensions/`；Edge 打开 `edge://extensions/`。
3. 删除旧的 `Yanpb OJ Submit Bridge` / `Yanpb OJ Result Bridge` 测试版本（不是 Competitive Companion）；加载新版 `oj/submit-extension` 文件夹（包含 manifest.json），或者在已有扩展上点击**重新加载**并确认版本为 `1.2.0`。
4. 同时启动 CodeLab 和 Chrome/Edge，进入 CodeLab「极速 OJ」→ 「连接浏览器扩展」，获取六位授权码；在新版扩展的弹窗输入授权码。首次配对或旧授权失效时需要重新操作。
5. 扩展弹窗「检测连接并同步判题」应显示 `✓ CodeLab 已连接` 和端口 `10045`；CodeLab 连接状态会自动刷新。
6. 在浏览器登录 Codeforces/AtCoder/洛谷，CodeLab 中为当前 `.cpp` 关联正确题目 URL，使用「浏览器提交」打开官网，**在官网人工确认提交**；不要只打开网页就期待有官方结果。
7. 官方页面进入提交详情 `.../submission/数字`、`.../submissions/数字` 或 `.../record/数字` 后，等待状态回传。若提交后停在列表页，可点击自己提交的**具体记录**进入详情页。
8. Codeforces 若未设置 Handle，IDE 无法按官网 `user.status` 进行可靠题目/成绩核验。AtCoder/洛谷详情页若缺少唯一的题号或状态字段，只能保留待核验，不能凭页面猜测 AC。

### Windows 连接诊断

PowerShell：

```powershell
Test-NetConnection 127.0.0.1 -Port 10045
netstat -ano | findstr :10045
```

`TcpTestSucceeded : True` 说明有本机程序监听端口，**但不能单凭此证明是 Yanpb CodeLab**。如果 CodeLab 显示端口占用错误，用 `Get-Process -Id <PID>` 确认占用进程，再关闭旧版 CodeLab 或其他冲突程序。

### macOS 连接诊断

```bash
lsof -nP -iTCP:10045 -sTCP:LISTEN
```

如果扩展弹窗显示 `不同的浏览器扩展` 或 `授权失效`，在 CodeLab 重新发起六位码授权；不应将扩展的 Authorization Token 复制给第三方。

如果连接正常但只有提交 ID，没有 AC/WA：请确认实际进入了官方**提交详情页**，且当前浏览器页面能看到题目身份与判题状态。对 Codeforces 还需正确 Handle。

## 验证边界

自动测试覆盖本地协议重配对、重启后监听恢复、任务重领限制、Chrome MV3 工作脚本模拟浏览器标签事件、实际 127.0.0.1:10045 HTTP 回传以及表格判题解析。这不是三个真实官网的登录、提交、判题端到端验收。网站更改 DOM、登录受限或认证措施调整时仍可能需要更新适配器。

## 重要隐私与安全

- 代码和凭据保存在本地；桥接服务只监听 `127.0.0.1`，鉴权凭据存在桌面客户端与对应浏览器扩展的本地存储中。
- 扩展不会读取网站密码/Cookie，也不会自动点击官方提交按钮，不能绕过 CAPTCHA。
- 本地样例 AC **不等于官方 AC**；只有在核对官方题号、提交记录和判题信息后才能显示官方结果。
