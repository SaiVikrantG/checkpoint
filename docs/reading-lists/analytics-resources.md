# Analytics Resources — First Principles Guide

A curated collection of resources for building web analytics from the ground up: page view tracking, referrer analysis, contribution graphs, time-series rollups, and privacy-preserving visitor identification.

---

## 1. Web Analytics Fundamentals

| Resource | Summary | Level |
|----------|---------|-------|
| [How Web Tracking Works — Two Octobers](https://twooctobers.com/blog/how-web-tracking-works/) | Full tracking lifecycle: what data the browser sends, cookies vs localStorage, how raw events become reports. **Start here.** | Beginner |
| [Pageview — Tracking Garden](https://tracking-garden.com/knowledge/web-analytics/pageview/) | Precise definition of a pageview at the protocol level — URL, timestamp, user agent, referrer, sessions vs uniques. | Beginner |
| [Beacon API — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Beacon_API) | The browser API your analytics script uses to fire events without blocking the page. | Intermediate |
| [Using Beacon API for Tracking Pixels — DeltaX Engineering](https://engineering.deltax.com/articles/2017-12/using-sendbeacon-api) | How tracking pixels (1x1 GIFs) and `navigator.sendBeacon()` work under the hood. Explains why sendBeacon was invented (data loss on page unload with XHR). | Intermediate |
| [Build Your Own Web Analytics From Scratch — vmois.dev](https://vmois.dev/build-web-analytics-project-from-scratch/) | Builds a minimal tracker from first principles: plain JS, per-page UUID, `visibilitychange` event, POST to backend. | Intermediate |
| [DIY Web Analytics — jmmv.dev](https://jmmv.dev/2022/02/diy-web-analytics.html) | Another from-scratch build using PostgreSQL as the backend. Short but dense with practical schema decisions. | Intermediate |
| [Creating My Own Web Analytics Tool — Medium](https://medium.com/swlh/creating-my-own-web-analytics-tool-dca5a1c720e3) | Full end-to-end build: JS tracker, backend ingestion endpoint, PostgreSQL storage, and Chart.js visualizations. | Intermediate |

## 2. Referrer Tracking

| Resource | Summary | Level |
|----------|---------|-------|
| [HTTP Referer — Wikipedia](https://en.wikipedia.org/wiki/HTTP_referer) | Definitive reference: history, the famous misspelling, rules for when it's stripped. | Beginner |
| [Referer Header — HowHTTPWorks](https://howhttpworks.com/headers/referer) | Protocol-level explanation of where the header sits in an HTTP request. | Beginner |
| [HTTP Headers: Referer Practical Guide — TheLinuxCode](https://thelinuxcode.com/http-headers-referer-practical-guide-for-2026/) | All edge cases where referrer data disappears (HTTPS to HTTP, `rel=noreferrer`, in-app browsers) and workarounds. | Intermediate |
| [Why Am I Not Seeing the Full Referrer URL? — Fathom Analytics](https://usefathom.com/docs/troubleshooting/referrer-policy) | Explains Referrer-Policy directives (`strict-origin-when-cross-origin`, `no-referrer`, etc.) and what each means for analytics data completeness. | Intermediate |
| [Referrer and UTM Parameters — Pirsch Docs](https://docs.pirsch.io/advanced/referrer-utm) | How to combine Referer headers with UTM params (`utm_source`, `utm_medium`, `utm_campaign`) for complete traffic attribution. | Intermediate |

## 3. Event Tracking Architecture & Open-Source Codebases

| Resource | Summary | Level |
|----------|---------|-------|
| [Analytics Pipeline Architecture — Codelit.io](https://codelit.io/blog/analytics-pipeline-architecture) | Full pipeline overview: client SDK, buffering, ingestion, queue, processing, storage, aggregation. Technology-agnostic. | Intermediate |
| [Umami Code Reading — Shekhar Gulati](https://shekhargulati.com/2022/05/22/code-reading-and-building-1-umami-an-open-source-google-analytics-alternative/) | Thorough walkthrough of Umami's codebase: ER diagram, session/pageview model, how the tracker fires events. **Best resource for studying a small-scale real system.** | Intermediate |
| [Umami PostgreSQL Schema — DeepWiki](https://deepwiki.com/umami-software/umami/5.1-postgresql-schema) | The actual Prisma-generated PostgreSQL schema for Umami with relationship diagrams. Study this when designing your own schema. | Intermediate |
| [Umami GitHub Repository](https://github.com/umami-software/umami) | Full source (~15k lines TypeScript). Study `src/pages/api/send.ts` (event ingestion) and the Prisma schema. | Intermediate |
| [Pirsch GitHub Repository (Go)](https://github.com/pirsch-analytics/pirsch) | **Written in Go — matches our stack.** Server-side analytics with no client JS. Study the hit processing and aggregation code. | Advanced |
| [Plausible Analytics GitHub Repository](https://github.com/plausible/analytics) | Elixir/Phoenix + ClickHouse. The tracker script (`priv/tracker/`) is plain JavaScript worth reading. ClickHouse schema in `priv/repo/clickhouse_migrations/`. | Advanced |
| [PostHog Ingestion Pipeline — PostHog Docs](https://posthog.com/docs/how-posthog-works/ingestion-pipeline) | How a production system does it: Rust ingestion, Kafka, Node.js processing, ClickHouse. Understand what "serious scale" looks like. | Advanced |
| [PostHog Architecture Overview — PostHog Docs](https://posthog.com/docs/how-posthog-works) | Full system topology: what each service does, why ClickHouse for events vs PostgreSQL for metadata, what Kafka is used for. | Advanced |

## 4. Time-Series Data & Rollups in PostgreSQL

| Resource | Summary | Level |
|----------|---------|-------|
| [PostgreSQL Rollups with Time Buckets — Medium](https://medium.com/@kushpranjale/cumulative-data-without-the-pain-postgresql-rollups-with-time-buckets-aba518ddf917) | How to use `date_trunc()` to bucket events by day/week/month and build summary tables. **No TimescaleDB needed.** | Intermediate |
| [Fast Time-Series with Materialized Views — Tiger Data](https://www.tigerdata.com/blog/creating-a-fast-time-series-graph-with-postgres-materialized-views) | Step-by-step tutorial for pre-computing time-series graphs with materialized views and indexes. | Intermediate |
| [Postgres Materialized Views Guide — Epsio](https://www.epsio.io/blog/postgres-materialized-views-basics-tutorial-and-optimization-tips) | Full lifecycle: creation, `REFRESH MATERIALIZED VIEW CONCURRENTLY`, when incremental refresh matters. | Intermediate |
| [Continuous Aggregates Intro — Timescale](https://medium.com/timescale/real-time-analytics-for-time-series-a-devs-intro-to-continuous-aggregates-b9c38b5746f0) | Incrementally maintained materialized views that auto-update. Even without TimescaleDB, the concepts inform your own rollup design. | Intermediate |
| [TimescaleDB Continuous Aggregates on Kubernetes — OneUptime](https://oneuptime.com/blog/post/2026-02-09-timescaledb-continuous-aggregates/view) | Real production case study: hypertable creation, continuous aggregate definition, refresh policy, query patterns. | Advanced |

## 5. Contribution/Activity Graphs

| Resource | Summary | Level |
|----------|---------|-------|
| [Recreate GitHub's Contribution Graph — HackerNoon](https://medium.com/hackernoon/how-to-recreate-githubs-contribution-graph-a0a8d4d91011) | Reverse-engineers the SVG structure, cell positioning by week/weekday, and color intensity mapping. Includes working code. | Beginner |
| [Understanding GitHub Contribution Graphs — GitBlend](https://gitblend.com/kb/understanding-github-contribution-graphs) | What GitHub actually counts (not all commits qualify), the rules for what constitutes "activity". Useful for deciding what activity means in your own graph. | Beginner |
| [GitHub Contribution Plot for Time Series — Built In](https://builtin.com/data-science/github-contribution-plot) | Data modeling side: how to aggregate any event data by day and render it as a heatmap calendar. Includes the SQL query pattern. | Intermediate |
| [D3.js Calendar Heatmap Tutorial — RisingStack](https://blog.risingstack.com/tutorial-d3-js-calendar-heatmap/) | Most complete D3 heatmap tutorial — SQL query for daily aggregates, D3 layout logic, and color scale. | Intermediate |
| [React Heatmap Calendar — LabEx](https://labex.io/tutorials/javascript-building-a-react-github-heatmap-contributions-445705) | React implementation using `react-calendar-heatmap` with theming and tooltips. Directly relevant to our React frontend. | Beginner |

## 6. Privacy & Cookieless Tracking

| Resource | Summary | Level |
|----------|---------|-------|
| [Pirsch Privacy Docs — Cookieless Mechanism](https://docs.pirsch.io/privacy) | The "daily salted hash" technique: `hash(IP + UserAgent + date + salt)` produces an anonymous daily visitor ID. No cookies, no localStorage, GDPR-compliant. **Implement this in the Go backend.** | Intermediate |
| [Cookieless Tracking: Does It Exist? — ApplyData](https://applydata.io/cookieless-tracking-does-it-exist-and-does-it-make-sense/) | Honest look at what "cookieless" actually means: server-side fingerprinting still processes personal data, probabilistic attribution has accuracy tradeoffs. | Intermediate |
| [Cookieless Tracking and GDPR — Complianz](https://complianz.io/cookieless-tracking-and-gdpr/) | Which tracking approaches require consent banners vs those that are GDPR-exempt. IP-based fingerprinting is still personal data under GDPR. | Beginner |
| [Online Tracking Mechanisms — Cyber Raiden](https://cyberraiden.wordpress.com/2025/03/17/online-tracking-through-web-browsers-mechanisms-and-implications/) | Full spectrum of browser tracking mechanisms: cookies, localStorage, ETags, canvas fingerprinting, font enumeration, AudioContext. | Intermediate |
| [Brave Privacy Updates — Referrer Policy](https://brave.com/privacy-updates/5-grab-bag/) | Browser vendor perspective on referrer data leaks and countermeasures (query stripping, `strict-origin-when-cross-origin` default). | Intermediate |

---

## Recommended Reading Order

1. **Two Octobers** + **HowHTTPWorks Referer** — build the mental model
2. **MDN Beacon API** + **vmois.dev "Build Your Own"** — understand browser-side mechanics
3. **Shekhar Gulati's Umami code reading** — study a real small-scale system end-to-end
4. **PostgreSQL rollups article** + **Tiger Data materialized views** — design the storage/aggregation layer
5. **Pirsch privacy docs** (daily salted hash) — implement cookieless visitor identification in Go
6. **Pirsch GitHub repo** (Go) — reference implementation closest to our stack
7. **RisingStack D3 heatmap** or **LabEx React heatmap** — build the contribution graph visualization
8. **PostHog ingestion pipeline docs** — understand what to change if you outgrow the simple design
