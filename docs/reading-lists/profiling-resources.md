# Profiling & Performance Optimization — Reading List

A curated guide for building the intuition behind profiling: when to do it, why it matters, and how to use Go's toolchain (pprof, trace, benchmarks) to find and fix real bottlenecks.

---

## 1. The Intuition — Why Profile at All?

| Resource | Summary | Level |
|----------|---------|-------|
| [Knuth on Premature Optimization](https://wiki.c2.com/?PrematureOptimization) | The original quote in context: "premature optimization is the root of all evil." Understand *when not to* optimize before you learn how. | Beginner |
| [Systems Performance Introduction — Brendan Gregg](https://www.brendangregg.com/systems-performance-2nd-edition-book.html) | Chapter 1 is freely available. Gregg defines performance methodology: why guessing is wrong, what "profiling" means at a systems level. | Beginner |
| [The USE Method — Brendan Gregg](https://www.brendangregg.com/usemethod.html) | A framework for diagnosing performance problems: Utilization, Saturation, Errors. Gives you a mental checklist before touching any tool. | Beginner |

## 2. Flame Graphs — Reading Profiler Output

| Resource | Summary | Level |
|----------|---------|-------|
| [Flame Graphs — Brendan Gregg](https://www.brendangregg.com/flamegraphs.html) | Gregg invented flame graphs. This page explains what the x-axis and y-axis mean, how to read width as time, and how to spot bottlenecks visually. **Read before using pprof.** | Beginner |
| [Flame Graphs for Go — Go Blog](https://go.dev/blog/pprof) | Official Go blog post by Russ Cox. Short, practical. Shows the full workflow: add pprof, collect a profile, open the flame graph, act on findings. | Beginner |

## 3. Go-Specific Profiling Tools

| Resource | Summary | Level |
|----------|---------|-------|
| [High Performance Go Workshop — Dave Cheney](https://dave.cheney.net/high-performance-go) | The best single resource for Go performance: covers benchmarks, pprof, escape analysis, GC pressure, and compiler inlining. Free and thorough. **Start here for Go.** | Intermediate |
| [pprof Documentation — pkg.go.dev](https://pkg.go.dev/net/http/pprof) | Reference for the `net/http/pprof` package: which endpoints exist (`/profile`, `/heap`, `/goroutine`, `/trace`) and what each measures. | Intermediate |
| [Profiling Go Programs — Go Blog](https://go.dev/blog/profiling-go-programs) | Older but canonical walkthrough using a real program. Shows CPU profiling, memory profiling, and goroutine profiling end-to-end with `go tool pprof`. | Intermediate |
| [Go Execution Tracer — Go Docs](https://pkg.go.dev/runtime/trace) | Reference for the `trace` tool. The tracer records goroutine scheduling, GC events, and syscalls on a timeline — useful when pprof doesn't explain latency spikes. | Intermediate |
| [An Introduction to go tool trace — Gophercon Talk](https://about.sourcegraph.com/blog/go/an-introduction-to-go-tool-trace) | Visual walkthrough of the trace viewer output: what each lane means, how to spot GC pauses and goroutine contention. | Intermediate |

## 4. Benchmarks

| Resource | Summary | Level |
|----------|---------|-------|
| [How to Write Benchmarks in Go — Dave Cheney](https://dave.cheney.net/2013/06/30/how-to-write-benchmarks-in-go) | The benchmark loop, `b.ResetTimer()`, `b.N`, `-benchmem` flag. Short and precise. | Beginner |
| [Benchstat — golang.org/x/perf](https://pkg.go.dev/golang.org/x/perf/cmd/benchstat) | Tool for comparing two sets of benchmark results statistically. Tells you if an optimization is real or noise. | Intermediate |

## 5. Memory & GC Optimization

| Resource | Summary | Level |
|----------|---------|-------|
| [Go GC Guide — Go Docs](https://go.dev/doc/gc-guide) | Official guide: how the Go GC works, GOGC tuning, memory limits, when GC causes latency. | Intermediate |
| [Allocation Efficiency in Go — Ardan Labs](https://www.ardanlabs.com/blog/2023/07/getting-familiar-with-the-go-memory-model.html) | Stack vs heap allocation, escape analysis, why small allocations in hot paths hurt. | Intermediate |
| [pprof Heap Profiles — Julia Evans](https://jvns.ca/blog/2017/09/24/profiling-go-with-pprof/) | Practical walkthrough of reading a heap profile to find a memory leak. Good companion to the official docs. | Intermediate |

## 6. When to Profile

The short answer: **profile when APM/metrics tell you something is slow but not why.** Profiling is step 3 in the sequence — measure → locate → profile → optimize → measure again.

**Profile when:**
- An endpoint shows high p95/p99 latency in your APM (New Relic, Datadog) and reading the code doesn't explain it
- Memory grows over time and doesn't recover — classic leak signal
- CPU is consistently high under normal load, not just during spikes
- You're about to make a performance optimization and want before/after data to verify it worked

**Don't profile when:**
- You only have a suspicion — add structured logging and metrics first to find the slow path
- Writing new code — get it correct first, optimize later
- Load is artificial/low — profiling under toy traffic produces misleading results

**APM vs profiler:** APM (New Relic, etc.) tells you *that* an endpoint is slow and roughly *where* (handler, DB, external call). A profiler tells you *why* — which function, which line, which allocation inside that code. Use APM to find the problem, use pprof to diagnose it.

| Resource | Summary | Level |
|----------|---------|-------|
| [Knuth: Premature Optimization (full essay context)](https://wiki.c2.com/?PrematureOptimization) | The "root of all evil" quote in context — make it work, make it right, *then* make it fast. | Beginner |
| [The USE Method — Brendan Gregg](https://www.brendangregg.com/usemethod.html) | A checklist for deciding *what kind* of problem you have (CPU-bound, memory-bound, I/O-bound) before picking a tool. | Beginner |
| [When to Optimize Go Code — Ardan Labs](https://www.ardanlabs.com/blog/2018/12/garbage-collection-in-go-part1-semantics.html) | Explains GC pressure as a signal — when allocation patterns start affecting latency, that's when to reach for the heap profiler. | Intermediate |

---

## Recommended Reading Order

1. **Knuth on Premature Optimization** — understand the philosophy first
2. **Brendan Gregg's Flame Graphs** — build the visual vocabulary
3. **Dave Cheney's High Performance Go Workshop** — Go intuition + tools end-to-end
4. **Official pprof blog post** (`go.dev/blog/pprof`) — 15-minute hands-on primer
5. **Dave Cheney's benchmark post** — write your first benchmark
6. **Go GC Guide** — once you hit memory issues in a real service
7. **go tool trace intro** — once pprof doesn't explain a latency spike
