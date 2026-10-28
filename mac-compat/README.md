# Yanpb Mac C++ compatibility

`bits/stdc++.h` is not part of ISO C++; Apple's libc++ does not ship it. The
header in `bits/stdc++.h` only includes public standard C++ headers. GNU
extensions like `__gnu_pbds`, `__int128` behavioral differences, or GNU-only
builtins are NOT ported. This workaround is included in the macOS DMG/ZIP
under `Contents/Resources/mac-compat` and passed to `clang++` via `-I`.

The project does not copy Apple's proprietary macOS SDK. Users must use Apple
Command Line Tools installed separately or Xcode.
