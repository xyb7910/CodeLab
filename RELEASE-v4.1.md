# Yanpb CodeLab v4.1 · UI / Diagnostics / Multi-contest release

v4.1 is an incremental update of the existing Windows-local Electron IDE, retaining bundled GCC/GDB, OI file I/O, Competitive Companion, editor template snippets, local histories, and 2-second autosave.

## 1. Complete ICPC / OI UI transition

Switch modes using the top-left toggle or `Alt+1` / `Alt+2`. Navigation, editor, inspector and code watermark transition together using coordinated 0.7 s color wash, opacity and subtle motion. Users with OS reduced-motion preference receive an immediate non-animated switch. Each mode keeps its own contest and console height.

## 2. Sample data at the left top

The left explorer now begins with a pinned **Sample Input** dock. Select a case, edit input, click `F7` to test all samples, or copy the selected case into STDIN. This is synchronized with the active file's sample list; switching code files doesn't mix inputs. The right pane prioritizes case selection, expected output and verdicts; when the left side is collapsed, the original right-side sample editor becomes available as fallback.

## 3. Source-inline compiler diagnostics

Compiler errors/warnings now appear as marked source lines, red/yellow gutter indicators, underlined tokens and explanatory widgets with beginner-friendly suggested checks. `Renderer/inline-diagnostics.js` parses GCC/Clang location diagnostics with Windows drive letters and spaces. The original compiler output remains accessible in the terminal, and annotations are cleared when a file changes or another file is selected. They are diagnostic observations, not proof of why the algorithm fails or a full language-server replacement.

## 4. Multi-contest manager

Click the `▤` icon in the live contest ribbon to browse multiple current/recent contests in the active ICPC/OI mode, switch among them, open a contest from disk, create new, or remove an entry from the recent list. Removing a recent entry **does not delete source files**. Existing single-contest state migrates automatically. The competition registry identifies contests by normalized absolute folder so identically named contests at different paths remain distinct.

## 5. Animated collapsible panels

- Left explorer: rail layout icon or `Ctrl+B`; reopen from the same fixed rail button.
- Right inspector: editor toolbar split icon or `Ctrl+Alt+R`; reopen from the same button.
- Bottom console: arrow in console header or `Ctrl+\``; drag separator to resize when expanded.
- Both side panels animate their track width and content opacity; folds retain previous widths.

## Testing and Windows builds

Run `npm test` to execute all Node C++ compile, contest, UI-logic and diagnostic parser tests. Browser automation also exercises the real CodeMirror UI in Chromium, including file-level annotations, same-mode multi-contest switching, and panel open/close at different resolutions.

**This is a source/build project, not a precompiled Windows EXE.** On a Windows 10/11 x64 build machine install Node.js 22+, unzip and run `build-windows.bat`; the build downloads/verifies and bundles GCC/GDB using the existing toolchain pipeline. Windows installer execution and actual bundled GCC/GDB remain subject to Windows machine verification.

Author: Yanpb
