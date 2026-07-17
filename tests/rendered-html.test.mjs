import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the Kaka Province intelligence dashboard", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>卡卡省-美国卡派资讯&amp;竞对动态监控网站<\/title>/i);
  assert.match(html, /今日热点 TOP 3/);
  assert.match(html, /竞对动态监控/);
  assert.match(html, /FreightWaves/);
  assert.match(html, /原文发布/);
  assert.match(html, /仅近 30 天/);
  assert.match(html, /省多多北美卡车平台/);
  assert.match(html, /货马达美国卡车运输平台/);
  assert.match(html, /data-category="市场运价"/);
  assert.match(html, /data-filter="市场运价"/);
  assert.match(html, /筛选运价与货量专题/);
  assert.match(html, /省多多/);
  assert.match(html, /货马达/);
  assert.match(html, /https:\/\/xhslink\.com\/m\/75sNtVt2wwW/);
  assert.match(html, /https:\/\/v\.douyin\.com\/xEe-XTIB5VA/);
  assert.match(html, /小红书(?:<!-- -->)? ↗/);
  assert.match(html, /公众号(?:<!-- -->)? · 待补/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/i);
});

test("starter preview dependencies and markers are removed", async () => {
  const [page, layout, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /卡卡省/);
  assert.match(layout, /lang="zh-CN"/);
  assert.match(page, /DATA_WINDOW_DAYS = 30/);
  assert.doesNotMatch(page, /link:\s*"https:\/\/www\.freightwaves\.com\/news\/category\//);
  assert.doesNotMatch(page, /SkeletonPreview|codex-preview/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);
});

test("GitHub Pages export is self-contained", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /href="\.\/app\/globals\.css"/);
  assert.match(html, /data-category="市场运价"/);
  assert.match(html, /data-filter="市场运价"/);
  assert.match(html, /topicButtons/);
  assert.doesNotMatch(html, /__VINEXT|\/assets\//);
});
