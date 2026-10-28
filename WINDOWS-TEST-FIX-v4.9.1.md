# Yanpb CodeLab v4.9.1 — Windows 单元测试误报修复

## 故障

v4.9 在 Windows 构建时执行 `npm test`，`tests/local-runner.test.cjs` 第 10 行仍检查编译器的 `name` 或 `path` 必须恰好等于 `g++`；但 v4.8 起客户端只允许使用随程序内置的 `g++.exe` 绝对路径，因此会把已经正确检测到的工具链误判成失败。

## 修改内容

- `tests/local-runner.test.cjs`：Windows 测试运行条件改为检测已准备的内置 GCC，而不是依赖系统 PATH；断言验证返回的是 `bundled:true` 且路径以 `g++.exe` 结尾。其他平台仍检查已安装的 `g++/clang++`。
- `tests/zero-config.test.cjs`：版本断言更新为 4.9.1。
- `package.json`：版本号更新为 4.9.1。**未修改 IDE 运行器、C++ 编译、GDB、clangd 或样例功能。**

## 推荐操作

1. 若已拥有完整 v4.9 工程，下载“小型补丁”，把补丁内的文件覆盖项目根目录。
2. 在 Windows PowerShell 进入项目目录，运行 `npm test`。
3. 通过后运行 `build-windows-mirror.bat`，继续构建内置 GCC 的 Windows 安装包。
4. 如果检测不到内置 GCC，检查构建阶段是否已准备 `toolchain\mingw64\bin\g++.exe`。不要通过选择系统 GCC 绕过限制。

说明：Linux 环境已执行全套回归；Windows 上仍需实际运行完成确认。
