# Yanpb CodeLab 3.3.1 · Windows GCC linker fix (Binutils #34395)

## What failed?

When CodeLab v3.3 is installed in `C:\Users\Hetao\AppData\Local\Programs\Yanpb CodeLab Local`, the bundled WinLibs 16.2.0 GCC can compile C++ source but fails during linking:

```text
ld.exe: cannot find C:/Users/Hetao/.../Yanpb: No such file or directory
ld.exe: cannot find CodeLab: No such file or directory
ld.exe: cannot find Local/.../default-manifest.o
```

This is not an application syntax error or a C++ source bug. WinLibs' linker cannot correctly process the path of the optional Windows default manifest when the toolchain resides under a path containing spaces. The upstream bug is [GNU Binutils #34395](https://sourceware.org/bugzilla/show_bug.cgi?id=34395).

## Easiest solution: reinstall to a path without spaces

Use **`C:\YanpbCodeLab`** instead of the original `%LOCALAPPDATA%\Programs\Yanpb CodeLab Local`. Preserve your student files and settings before uninstalling/reinstalling. Do not simply rename the installed folder, because it may break Windows Start Menu links and uninstall metadata.

## Repair existing installed v3.3 without reinstalling

Run `Repair-Current-Installation.ps1` in PowerShell:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Repair-Current-Installation.ps1
```

The script creates a junction in `%LOCALAPPDATA%\YanpbCL-GCC\repair` pointing at the existing complete toolchain. It then displays the **new absolute path to `g++.exe`**. In CodeLab, open the compiler settings dialog and paste this space-free path instead of `auto`. Save and restart the application. This avoids moving/copying GCC itself and can repair the old binary. The script does not change the installed executable or student files.

**If the junction cannot be created**, use a non-spaced installation path instead. Do not run a suspicious installer as Administrator to bypass system security checks.

## v3.3.1 code-level fix

- Compiler discovery detects WinLibs installed under a path with spaces.
- Before invoking it, the application creates a **per-user Windows directory junction** in a no-space local AppData directory and invokes `g++.exe` through that alias. It checks that an existing alias points to the correct bundled GCC directory.
- Both normal compilation and CSP file judging use this resolved path, including runtime PATH for the GCC DLLs.
- The default new-install program directory name is `YanpbCodeLab` (no spaces). Desktop shortcut name is still **Yanpb CodeLab**. The old Electron user profile is retained for drafts and settings when present.
- Builds check compiler completeness. Smoke tests in Windows are still required: clean install, manual install into a path with spaces, Portable under a spaced directory, and invoking IDE + CSP file-IO judging.

## Rebuild

From the full source ZIP (not the small patch ZIP) run `build-windows.bat` on Windows with Node.js 22+. This downloads the full WinLibs toolchain before producing the NSIS setup and portable executables. The source ZIP itself does not contain the complete GCC or Electron Windows runtime.

## Security

Never execute untrusted competition source files: local C++ programs run with the current user's operating-system permissions. A directory junction is a filesystem alias, not a process sandbox.
