# Yanpb CodeLab v4.4.1 — Electron 下载超时修复

## 你的错误是什么

```text
Downloading electron-v38.8.6-win32-x64.zip 100%
connect ETIMEDOUT 20.205.243.166:443
BUILD FAILED: electron-builder failed (exit code 1)
```

这是构建机下载 Electron 桌面运行时或验证下载资料时访问 GitHub 超时，不是 C++、GCC/GDB、学生代码或最终 EXE 安装失败。界面显示 `100%` 也不代表整个构建阶段已完成。

## 推荐：直接在 v4.4.1 工程双击 `build-windows.bat`

**自动选择**（默认）：先从 npmmirror 获取 Electron；如果安装/打包下载失败，尝试回退 GitHub 官方源。已经准备好的 GCC、clangd 和 npm 依赖可复用，避免每次重新解压工具链。正常下载仍保持 Electron 的校验，不关闭 HTTPS 或证书验证。

可以显式指定下载源：

```powershell
# 优先用镜像（最适合 GitHub 连接超时）
.\build-windows.bat -ElectronSource Mirror

# 只使用官方 GitHub，不使用镜像
.\build-windows.bat -ElectronSource GitHub

# 默认镜像优先，失败回退 GitHub
.\build-windows.bat -ElectronSource Auto
```

也可只对现有 v4.4.0 工程临时执行：

```powershell
$env:ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
npm run build:win -- --config.electronDownload.mirror=https://npmmirror.com/mirrors/electron/
```

注意：上述**临时命令**要在 `npm install` 已经完成、且 GCC/GDB/clangd 已准备好的项目根目录运行；如果 npm 安装 Electron 的阶段也超时，改用完整 v4.4.1 脚本。

## GitHub 与镜像都不通：离线 Electron ZIP

离线 ZIP 是应对 Electron 下载单点超时的替代方式；**不是让整个首次构建完全离线**。npm 依赖、GCC/clangd 和 electron-builder 其他工具集仍需已安装/有缓存。

1. 如果已运行 `npm install`，在项目根目录执行：
   ```powershell
   node -p "require('./node_modules/electron/package.json').version"
   ```
   以实际结果为准，例如截图中使用的是 `38.8.6`。
2. 通过浏览器下载与版本及 x64 平台对应的官方 Electron 压缩包：
   `https://github.com/electron/electron/releases/download/v38.8.6/electron-v38.8.6-win32-x64.zip`
   或同版本 npmmirror 镜像。不允许用名字近似或来源不明的 ZIP。
3. 从官方同版本 `SHASUMS256.txt` 查得上面 ZIP 的 SHA-256 校验值：
   `https://github.com/electron/electron/releases/download/v38.8.6/SHASUMS256.txt`
4. 运行（将路径与哈希替换为下载得到的实际值）：
   ```powershell
   .\build-windows.bat -ElectronSource LocalZip -ElectronZip 'D:\Downloads\electron-v38.8.6-win32-x64.zip' -ElectronSHA256 '此处填写官方文件的64位SHA256'
   ```
5. 脚本会验证哈希、当前 npm Electron 版本与压缩包名称后，复制到 `.cache-electron-verified`，让 electron-builder 从本机解包。**哈希不匹配会终止构建**。

## 打包镜像策略的实现

- 本工程固定使用 `electron-builder` **v26** 配置结构。
- `npm install` 读取 `ELECTRON_MIRROR`；`electron-builder` 读取 `build/network.builder.cjs` 中的 `electronDownload.mirror`，两者不能只设置其中之一。
- `build:compact` 继承相同的网络设置，`-Compact` 仍可用。
- 已有工具链、cache 不会因为切换镜像而删除。
- 不使用 `ELECTRON_SKIP_BINARY_DOWNLOAD` 来欺骗 electron-builder：该环境变量**仅在选择 LocalZip 时、且仅对 npm 安装阶段生效**，真正打包使用的是 `electronDist`。
- 此修复不会修改 v4.4 的 IDE、clangd、GDB、题库或用户数据。

## 若再次失败，区分新的失败环节

- 日志包含 `electron-v...-win32-x64.zip`：仍是 Electron 下载，先检查镜像是否可访问或使用 LocalZip。
- 包含 `winCodeSign`、`nsis`、`7za` 等：是 electron-builder 的**另一套工具下载**；Electron 镜像并不一定解决这类问题，需缓存相应工具或解决代理网络。
- 包含 `clangd-windows...zip`：是 clangd 下载，不是 Electron。检查 `.cache-clangd` 并使用现有固定哈希流程。
- 包含 `cannot find default-manifest.o`：这是早期 GCC 安装路径空格问题，与当前网络故障是不同问题。

若仍失败，请把**新的最后 30 行日志**提供出来。不要删除所有缓存或关闭安全校验。

## 当前验证范围

本版在 Linux 开发容器通过 Node.js 自动测试；已验证 v26 的源码配置切换规则、镜像回退分支和本地包参数校验逻辑。**没有在当前环境实际联网下载 Windows Electron 或成功生成 EXE**，最终安装版需要 Windows 真机打包验收。
