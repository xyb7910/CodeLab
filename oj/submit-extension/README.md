# Yanpb OJ Result Bridge 2.0.0

适用于 Chrome 120+、Microsoft Edge 120+ 的独立 Manifest V3 扩展，与 Yanpb CodeLab 5.10.9+ 配合使用。

## 安装

1. 解压 `Yanpb-OJ-Result-Bridge-2.0.0.zip`。
2. 打开 `chrome://extensions` 或 `edge://extensions`。
3. 开启“开发者模式”，选择“加载已解压的扩展程序”，选中解压目录。
4. 启动 CodeLab，打开“工具 → OJ 浏览器连接”，生成六位授权码。
5. 点击浏览器工具栏中的扩展图标，输入授权码完成配对。

## 支持范围

- Codeforces、AtCoder、洛谷官方提交详情页结果监测。
- 将经过题目、比赛和 Submission ID 核对的判题结果回传给本机 CodeLab。
- 可选桌面通知；插件与 IDE 重启后可恢复尚未完成的监听任务。

## 安全边界

扩展只连接 `127.0.0.1:10045` 和清单中列出的官方 OJ 域名。它不读取密码或 Cookie，不绕过验证码，不自动点击提交，也不把源码发送到第三方服务。
