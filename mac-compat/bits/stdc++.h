// Yanpb CodeLab macOS portability shim (BSD-3-Clause style use of public C++ headers).
// Apple libc++ has no GNU bits/stdc++.h. This imports STANDARD C++ headers only;
// non-standard GNU extensions such as __gnu_pbds are not available.
#ifndef YANPB_MAC_STDCXX_COMPAT_H
#define YANPB_MAC_STDCXX_COMPAT_H
#include <algorithm>
#include <array>
#include <atomic>
#include <bitset>
#include <cassert>
#include <cctype>
#include <cerrno>
#include <chrono>
#include <climits>
#include <cmath>
#include <complex>
#include <condition_variable>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <deque>
#include <exception>
#include <functional>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <iterator>
#include <limits>
#include <list>
#include <map>
#include <memory>
#include <mutex>
#include <numeric>
#include <optional>
#include <queue>
#include <random>
#include <regex>
#include <set>
#include <sstream>
#include <stack>
#include <stdexcept>
#include <string>
#include <string_view>
#include <thread>
#include <tuple>
#include <type_traits>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <valarray>
#include <variant>
#include <vector>
#if __cplusplus >= 202002L
#include <bit>
#include <concepts>
#include <ranges>
#include <span>
#endif
#endif
