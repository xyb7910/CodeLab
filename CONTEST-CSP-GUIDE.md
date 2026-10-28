# Yanpb CodeLab 3.3 · 比赛模式与 CSP-J/S 复赛模拟考场

作者：Yanpb · Windows 10/11 · 纯本地训练

## 一、常规比赛：Codeforces / AtCoder / 洛谷 / ICPC / 自定义

点击左侧 🏆「比赛工作区」，或顶部「比赛模式」，选择竞赛平台。系统填充建议题号，支持修改：例如 Codeforces `A B C D E F`；AtCoder `A B C D E F G`；ICPC `A B C D E F G H`；也可自己输入任意不重复的合法英文题号。选择存储目录、比赛名、时长、C++ 标准、`A.cpp` 或 `A/A.cpp` 目录模式及 stdin/stdout / 文件输入输出模式后，一键新建。

例如 `Codeforces/CF_1150/` 内生成 `A.cpp`、`B.cpp`、`C.cpp`、`D.cpp`。会在本地保存 `.yanpb-contest.json` 元数据，重启后可以通过「打开已有比赛」恢复项目；源代码在 Windows 文件夹里是真实 `.cpp`，不是虚拟工作区。不会创建 `.git` 或 Sublime `.sublime-project`。

倒计时从**创建比赛文件**开始；时间结束会显示零，但本工具只是模拟计时，不会禁止操作、联网提交或锁定电脑。

## 二、CSP 复赛环境模拟

选择「CSP-J 复赛」或「CSP-S 复赛」。先按模拟考题填入本场**真实的题目英文名称**，例如 `apple pear banana tomato`，而不要沿用默认 task1/task2；输入考号、设置总时长并选择提交方式。默认是**考号文件夹收卷**：

```text
CSPJ_Mock_01/
  .yanpb-contest.json               ← IDE 元数据，不在考号提交文件夹内
  GD-J00001/                         ← 示例：考号目录
    apple/
      apple.cpp
    pear/
      pear.cpp
    banana/
      banana.cpp
    tomato/
      tomato.cpp
```

使用**平台逐题上传源码模拟**时，将在比赛项目根目录直接创建 `apple.cpp`、`pear.cpp` 等源码文件；不会模拟网页登录/真实上传，更不会伪造提交成功。2026 年部分省份（例如辽宁）明确采用平台自主提交，故不能对所有地区一律要求考号文件夹。

默认生成的 CSP 文件读写：

```cpp
#include <bits/stdc++.h>
using namespace std;
using i64 = long long;

int main() {
    freopen("apple.in", "r", stdin);
    freopen("apple.out", "w", stdout);
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // TODO: 实现算法
    return 0;
}
```

**不要把示例中的 `apple` 固定用到所有题目。** 文件 I/O 名称必须与比赛题目题面要求匹配。模拟评测会在临时目录创建 `apple.in`，程序执行后从 `apple.out` 读取结果，比对导入的预期答案。`.in`、`.out` 和 `.exe` 都在隔离的临时运行目录，不会混入考号提交文件夹。

按「样例测试」或 `Ctrl+Shift+Enter` 将触发 **CSP 文件 I/O** 的本地评测，而非标准输入模式。题目样例仍可来自 CPH、JSON 导入或右侧「测试样例」手动填写。

## 三、提交要求正确性检测

点击「提交检查」或按 `F8`，打开预检报告：

1. **文件规范**：真实磁盘上 `.cpp` 是否存在；文件名与大小写；题目子文件夹和考号文件夹；额外的 `.exe`、`.in`、`.out` 文件；源代码大小。
2. **文件读写**：查找未注释的 `freopen("task.in","r",stdin)` / `freopen("task.out","w",stdout)`，同时识别常见 `ifstream` / `ofstream` / `fopen` 写法。静态规则属于启发式判断，不能证明程序一定会正确读写；动态测试才是最终依据。
3. **跨平台提示**：识别部分常见 Windows 专用写法（如 `__int64`、`%I64d`、`windows.h`）；这不是 GNU/Linux 全面兼容性认证。
4. **编译**：使用本机（或内置）`g++` 编译，给出 CE/编译输出。
5. **样例测试**：逐样例运行，超时 TLE、运行错误 RE、错误答案 WA、未生成指定 `.out` 则为 `NO_OUTPUT`，过量输出则为 OLE。
6. **保存全部并逐题检测**：会将当前已打开的比赛文件保存回正确磁盘路径，再逐题读取磁盘源码检查；未打开的源码会按磁盘内容检测。

单独点击「检查磁盘提交目录」不会写回尚未保存的编辑器内容，因此它反映的是**已保存的提交状态**。若有 TODO、未运行样例或编译仅完成，报告会给出检查提醒，**不能将其理解为 AC**。

## 四、当前模拟与真实 CSP 认证的差异

- **2026 年 10 月 31 日**是 CSP-J/S 2026 第二轮日期；具体考点的提交方式、目录要求、源码标准、系统平台要以**所在省份/考点当年发放的认证者须知**为准。
- 例如，辽宁 2026 官方通知采用 NOI Linux 系统 + 平台自主提交模式；部分省份之前采用考号收卷目录模式。因此本软件同时提供两种**可选择的训练配置**，不能声称自动符合每个考点。
- 这是 Windows 本地模拟训练器。实际 CSP 最终成绩以官方 NOI Linux 评测系统为准：Windows GCC 编译通过并不保证 NOI Linux 一致。
- 它不是正式安全沙箱：待测 C++ 在本机当前账户权限下运行，只运行自己或可信来源的代码。
- **样例通过 ≠ 隐藏测试全部正确**。算法正确性、复杂度、内存边界需要额外使用更多测试点、对拍和证明核验；本工具不会凭样例模拟真实分数。
- 比赛倒计时不是强制考场锁屏、无法限制 OS 软件操作，也不接入官方平台进行提交。

相关官方参考：

- [CCF 2026 第二轮报名通知（日期）](https://noi.ccf.org.cn/xw/2026-09-29/933744.shtml)
- [辽宁省 2026 第二轮认证须知（采用平台自主提交）](https://noi.ccf.org.cn/gs/xw/ln/2026-10-13/939339.shtml)
- [广东省 2025 第二轮考生注意事项（目录和文件读写）](https://noi.ccf.org.cn/gs/xw/gd/2025-10-25/850192.shtml)

## 五、快捷键

| 操作 | Windows |
|---|---|
| 创建比赛 | `Ctrl + Shift + N` |
| 提交预检 | `F8` |
| 运行当前文件 | `Ctrl + Enter` |
| 运行全部样例 | `Ctrl + Shift + Enter` |
| 打开对拍实验室 | `F9` |
| 停止程序 | `F6` |
| 保存当前文件 | `Ctrl + S` |

## 六、构建 Windows 免配置安装包

Windows x64 构建机上先装 Node.js 22+，解压 v3.3 ZIP 后双击 `build-windows.bat`，它会下载并校验 WinLibs GCC，调用 Electron-builder 生成 Windows 安装程序与 portable EXE。**源码 ZIP 中不包含内置 GCC 或已构建的 EXE**。最终学生安装版无需再安装 Node.js / GCC。有关 Windows 运行构建限制见主 README。
