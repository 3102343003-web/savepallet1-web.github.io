import worker from "./dist/server/index.js";
import { readFile, writeFile } from "node:fs/promises";

const css = await readFile(new URL("./app/globals.css", import.meta.url), "utf8");

const response = await worker.fetch(
  new Request("http://localhost/"),
  { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
  { waitUntil() {}, passThroughOnException() {} },
);

let html = await response.text();
html = html
  .replace(/<link rel="modulepreload"[^>]*>/g, "")
  .replace(/<script[^>]*>[\s\S]*?<\/script>/g, "")
  .replace(/<\/html>[\s\S]*$/, "</html>")
  .replace(/<link rel="stylesheet"[^>]*>/, `<style>${css}</style>`);

const interactions = `<script>
void (async () => {
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };
  try {
    const response = await fetch(new URL("data/news.json", document.baseURI), { cache: "no-store" });
    if (!response.ok) throw new Error("资讯数据读取失败：" + response.status);
    const data = await response.json();
    if (data.schemaVersion !== 1 || !Array.isArray(data.newsItems)) throw new Error("资讯数据格式不兼容");
    const windowDays = Number(data.edition.windowDays) || 30;
    const windowMs = windowDays * 24 * 60 * 60 * 1000;
    const newsItems = data.newsItems.filter((item) => {
      const age = Date.now() - new Date(item.publishedDate + "T23:59:59Z").getTime();
      return age >= 0 && age <= windowMs;
    });
    setText("[data-news-edition]", data.edition.weekday + " · " + data.edition.date.replaceAll("-", "."));
    setText("[data-news-updated]", data.edition.updatedAt);
    setText("[data-news-issue]", "KAKA MORNING BRIEF · 第 " + data.edition.issue + " 期");
    setText("[data-news-brief-title]", data.brief.title);
    setText("[data-news-brief-summary]", data.brief.summary);
    setText("[data-news-reading]", "预计阅读 " + data.brief.readingMinutes + " 分钟");
    setText("[data-news-count]", newsItems.length);
    setText("[data-news-temperature]", data.brief.marketTemperature);
    setText("[data-news-risk-count]", String(newsItems.filter((item) => item.impact === "风险").length).padStart(2, "0"));
    setText(".range-chip", "仅近 " + windowDays + " 天");
    setText("[data-news-sources]", data.sources.join("、"));
    setText("[data-news-next-update]", data.edition.nextUpdate);
    const topStories = document.querySelector("[data-news-top-stories]");
    if (topStories) topStories.innerHTML = data.topStories.map((story) => '<article class="top-story ' + escapeHtml(story.tone) + '"><div class="story-meta"><span>' + escapeHtml(story.rank) + '</span><b>' + escapeHtml(story.category) + '</b></div><h3>' + escapeHtml(story.title) + '</h3><p>' + escapeHtml(story.summary) + '</p><div class="story-signal"><span>' + escapeHtml(story.signal) + '</span><strong>' + escapeHtml(story.signalText) + '</strong></div></article>').join("");
    const newsList = document.querySelector("[data-news-list]");
    if (newsList) newsList.innerHTML = newsItems.map((item) => '<article class="news-row" data-category="' + escapeHtml(item.category) + '"><div class="news-time"><em>原文发布</em><strong>' + escapeHtml(item.publishedAt) + '</strong><small>' + escapeHtml(item.publishedDay) + '</small><span>' + escapeHtml(item.source) + '</span></div><div class="score" aria-label="重要性评分 ' + escapeHtml(item.score) + '"><strong>' + escapeHtml(item.score) + '</strong><span>重要性</span></div><div class="news-body"><div class="news-title-line"><span class="impact ' + escapeHtml(item.impact) + '">' + escapeHtml(item.impact) + '</span><h3>' + escapeHtml(item.title) + '</h3></div><div class="news-copy"><p class="news-summary"><strong>原文摘要</strong><span>' + escapeHtml(item.summary) + '</span></p><p class="industry-view"><strong>行业看法</strong><span>' + escapeHtml(item.industryView) + '</span></p></div><div class="tag-row">' + item.tags.map((tag) => '<span>#' + escapeHtml(tag) + '</span>').join("") + '</div></div><div class="news-actions"><button aria-label="收藏资讯">☆</button><a href="' + escapeHtml(item.link) + '" target="_blank" rel="noreferrer">原文 ↗</a></div></article>').join("");
    const salesTips = document.querySelector("[data-news-sales-tips]");
    if (salesTips) salesTips.innerHTML = data.salesTips.map((tip, index) => '<li><b>' + String(index + 1).padStart(2, "0") + '</b><div><strong>' + escapeHtml(tip.title) + '</strong><p>' + escapeHtml(tip.summary) + '</p></div></li>').join("");
    document.querySelectorAll(".topic-list button[data-filter]").forEach((button) => {
      const count = newsItems.filter((item) => item.category === button.dataset.filter).length;
      const badge = button.querySelector("b");
      if (badge) badge.textContent = count;
    });
  } catch (error) {
    console.warn(error);
  }

  const buttons = [...document.querySelectorAll(".filter-row button")];
  const topicButtons = [...document.querySelectorAll(".topic-list button[data-filter]")];
  const input = document.querySelector(".search-box input");
  let active = "全部";
  const apply = () => {
    const query = (input?.value || "").trim().toLowerCase();
    document.querySelectorAll(".news-row").forEach((row) => {
      const categoryMatches = active === "全部" || row.dataset.category === active;
      const queryMatches = !query || (row.textContent || "").toLowerCase().includes(query);
      row.style.display = categoryMatches && queryMatches ? "" : "none";
    });
  };
  buttons.forEach((button) => button.addEventListener("click", () => {
    active = button.textContent?.trim() || "全部";
    buttons.forEach((item) => item.classList.toggle("active", item === button));
    topicButtons.forEach((item) => item.classList.toggle("active", item.dataset.filter === active));
    apply();
  }));
  topicButtons.forEach((button) => button.addEventListener("click", () => {
    active = button.dataset.filter || "全部";
    if (input) input.value = "";
    buttons.forEach((item) => item.classList.toggle("active", item.textContent?.trim() === active));
    topicButtons.forEach((item) => item.classList.toggle("active", item === button));
    apply();
    document.querySelector("#news")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  input?.addEventListener("input", apply);
  document.querySelectorAll(".news-actions button").forEach((button) => {
    button.addEventListener("click", () => {
      const saved = button.classList.toggle("saved");
      button.textContent = saved ? "★" : "☆";
    });
  });
})();
</script>`;

await writeFile(new URL("./index.html", import.meta.url), html.replace("</body>", `${interactions}</body>`), "utf8");
process.stdout.write("GitHub Pages index.html exported.\n");
