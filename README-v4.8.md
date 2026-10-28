# Yanpb CodeLab v4.8

**面向 ICPC / OI 的纯本地 C++ 桌面开发环境**。

新版简化顶部操作与导航按钮，重新设计分类设置界面，并强制 Windows 客户端只使用随程序打包的 GCC。保留比赛管理、CSP 模拟、CPH、GDB、clangd、两秒自动保存、代码模板和历史快照。

请先查看 [v4.8 发行说明](RELEASE-v4.8.md)，包含功能清单、编译器强制策略、安装包构建和验证状态。

开发测试：

```bash
npm test
```

Windows 构建：

```powershell
.\build-windows-mirror.bat
```

须先在构建电脑准备 Node.js 22+。此下载为源码，**不是已构建 EXE**。
