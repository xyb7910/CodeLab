# v3.1 免配置发行变更

- 完整的 Windows GCC 16.2.0 工具链打包策略；可用自带 g++.exe 自动识别，不依赖 PATH。
- 编译器与生成程序使用正确的工具链 DLL 搜索路径，增加 `-static-libgcc` / `-static-libstdc++` 减少动态依赖。
- Windows PowerShell 一键下载固定 WinLibs 版本，SHA-256 校验后解压。
- 安装包构建前强制校验头文件、库、编译器和链接器，Windows 上真实编译/运行验证。
- GitHub Actions Windows runner 自动构建 NSIS 安装版与 portable 免安装版。
- 编译器设置默认为 `auto`；高级用户可另选系统 Clang/GCC。
- 学生端仍保留 v3 的离线 IDE、样例测试、对拍、深浅色主题。

当前交付：完整可打包工程；Windows 安装 EXE 需要在 Windows 或 GitHub Actions 构建并实测。
