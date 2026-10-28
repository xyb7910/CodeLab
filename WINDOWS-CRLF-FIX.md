# Windows 回归测试修复说明（v3.3）

问题：Windows C++ 运行时可能产生 `\r\n`，Linux 通常为 `\n`。原先 4 项测试直接断言返回的原始字符串相等，因此在 Windows 上误报失败；实际比较器 `runner.compareOutput` 已正确处理两类行尾。

修改范围：`tests/local-runner.test.cjs`、`tests/competition.test.cjs`、`tests/zero-config.test.cjs`。新增 `tests/test-utils.cjs`（仅转换行尾，不删除空格）和 `tests/newlines.test.cjs`（专门覆盖 CRLF 和严格输出比较）。**没有改动学生程序的原始输出、对拍或正式评测算法。**

Windows 验证步骤：

1. 使用此修复版项目目录，或将补丁 ZIP 的 `tests/` 文件合并至原 `Yanpb-CodeLab-v3.3/tests/` 文件夹并覆盖对应文件。
2. PowerShell 在项目根目录执行 `npm test`，应不再出现截图中这 4 项换行符导致的断言失败。
3. 随后运行 `build-windows.bat`，继续完成 GCC 完整性验证与 Electron 安装包构建。

当前修复在 Linux 环境中执行过全套测试；未能在此环境直接执行 Windows GCC 的端到端测试。若还有新失败，请提供新的第一条 `not ok` 及其详情。
