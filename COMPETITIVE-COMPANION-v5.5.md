# Yanpb CodeLab v5.5｜直接连接浏览器 Competitive Companion

## 一、用户操作（真正的一键导入）

1. Chrome 安装官方 [Competitive Companion](https://chromewebstore.google.com/detail/competitive-companion/cjnmckjndlpiamhfimnnjmnckgghkjbl) 浏览器扩展；在支持的题目页面点击扩展图标。
2. 打开 Yanpb CodeLab v5.5。软件默认启用本机接收器 `127.0.0.1:10043`，并尝试监听 `::1:10043`，不需要输入配对码或粘贴 JSON。
3. CodeLab 自动创建新的 `.cpp` 标签，设置题目名称、OJ 链接和样例列表；题目来自当前比赛且 **比赛号/题号可核对** 时复用现有源文件，绝不覆盖现有代码。
4. 直接点击「样例测试」或 `Ctrl + Shift + Enter`（也可使用 F7）开始测试。
5. 后续同一题再次点击扩展，只更新测试用例，不覆盖学生已经写过的 C++ 程序。

**通信方向**：Competitive Companion（浏览器）→ 本地 loopback HTTP → CodeLab；不需要浏览器与 CodeLab 共享登录凭据。Companion 主要负责下载题目与样例，**并没有统一的 OJ 提交接口**。代码提交依然使用 CodeLab 的「极速 OJ」与官方确认机制。

## 二、如何确认已连接

在右侧「测试样例」页签，按钮显示「● CPH 已连接」。点击按钮打开连接设置，查看监听端口和自动启动选项。

- 默认端口：`10043`（Competitive Companion 支持的内置目标端口之一）。
- 如果 `10043` 被其他程序占用：在 CodeLab 的接收器设置里选择空闲端口（比如 `10046`），同时在扩展的 Options → `Custom ports` 加入 `10046`。**两侧必须相同。**
- 如果更改自定义端口后没有响应，确认没有启用其他程序占用该端口，重新点击题目页面的扩展图标。
- 如果暂时不需要本地接收，点击「停止接收器」，并取消下次启动自动连接。

**注意**：安装程序无法替浏览器自动安装扩展。浏览器扩展必须由用户自行安装或启用；CodeLab 不控制浏览器插件的权限与升级。Chrome / Edge 均可使用兼容的扩展版本；实际页面能否解析取决于 Competitive Companion 本身。

## 三、竞赛题目关联

支持稳定识别：

- Codeforces：`/contest/2040/problem/B`、`/problemset/problem/2040/B`；
- AtCoder：`/contests/abc405/tasks/abc405_c`；
- 洛谷：`/problem/P1000`；
- 其他 OJ：将题目 URL 作为去重标识，独立导入源码标签与样例。

为避免把别场比赛的 B 题误当成当前比赛的 B 题，复用现有比赛源码时必须验证比赛身份。无法核对时，CodeLab 会创建新标签，保留原比赛目录与源码。

## 四、设计与安全边界

- 监听器只绑定本机回环地址，不暴露公网；限制请求体和接收频率，并拒绝普通网页跨域请求。
- 在 Renderer 尚未准备好时接收的任务会进入有界队列，Renderer 恢复后再次显示；每条任务需单独确认已处理。
- 同一题的样例刷新不会覆盖学生源码；已有标签的原始名称和路径保留。
- 此功能不自动上传代码、绕过网站认证或假称官方 AC。
- 本模块的安全模型只保护正常网页跨站请求，**不能抵御已经在本机运行的恶意进程或恶意浏览器扩展**，不要运行未知代码。

## 五、开发者测试

```powershell
npm test
```

可做本地接收测试（PowerShell 7 推荐）：

```powershell
$body = '{"name":"A. Test","url":"https://codeforces.com/contest/2040/problem/A","tests":[{"input":"1 2\n","output":"3\n"}]}'
Invoke-RestMethod -Method Post -Uri 'http://localhost:10043/' -ContentType 'application/json' -Body $body
```

预期服务端返回 `{ "ok": true }`，CodeLab 创建对应标签（需要应用已经启动接收器）。

## 六、打包

仍使用 `build-windows-mirror.bat` 在 Windows 构建 NSIS Setup 和 Portable；依赖编译器、clangd、GDB 的原有内置方案不变。当前源码 ZIP 中不包含编译完成的安装版 EXE。开发者需要在 Windows 环境测试真实浏览器扩展的题目抓取、多个题目批量导入与官网提交工作流。
