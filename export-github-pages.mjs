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
  .replaceAll("http://localhost/og.png", "public/og.png")
  .replace(/<link rel="stylesheet"[^>]*>/, `<style>${css}</style>`);

const interactions = `<script>
void (async () => {
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
  const setText = (selector, value) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = value;
  };
  try {
    const response = await fetch(new URL("public/data/news.json", document.baseURI), { cache: "no-store" });
    if (!response.ok) throw new Error("资讯数据读取失败：" + response.status);
    const data = await response.json();
    if (data.schemaVersion !== 1 || !Array.isArray(data.newsItems)) throw new Error("资讯数据格式不兼容");
    const windowDays = Number(data.edition.windowDays) || 30;
    const windowMs = windowDays * 24 * 60 * 60 * 1000;
    const referenceMs = new Date(data.edition.date + "T23:59:59Z").getTime();
    const itemDate = (item) => item.publishedDate || item.updatedDate || item.effectiveDate || "";
    const newsItems = data.newsItems.filter((item) => {
      const age = referenceMs - new Date(itemDate(item) + "T23:59:59Z").getTime();
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

    const signalLabels = { "市场运价": ["运价与货量", "↗"], "法规合规": ["监管与合规", "§"], "经纪责任": ["经纪责任", "⚖"], "承运商风险": ["承运商风险", "!"], "公司动态": ["企业经营", "▦"], "司机与车队": ["司机与运力", "◇"], "新能源": ["新能源", "⌁"] };
    const trendSignals = Object.keys(signalLabels).map((category) => {
      const items = newsItems.filter((item) => item.category === category);
      const ages = items.map((item) => Math.floor((referenceMs - new Date(itemDate(item) + "T23:59:59Z").getTime()) / 86400000));
      const recent = ages.filter((age) => age >= 0 && age < 14).length;
      const previous = ages.filter((age) => age >= 14 && age < 28).length;
      const direction = recent > previous ? "升温" : recent < previous ? "回落" : "稳定";
      const maxScore = items.reduce((highest, item) => Math.max(highest, Number(item.score) || 0), 0);
      const riskCount = items.filter((item) => item.impact === "风险").length;
      return { category, recent, previous, direction, maxScore, count: items.length, weight: maxScore + riskCount * 6 + recent * 4 };
    }).filter((signal) => signal.count > 0).sort((a, b) => b.weight - a.weight).slice(0, 4);
    const signalGrid = document.querySelector(".signal-grid");
    if (signalGrid) signalGrid.innerHTML = trendSignals.map((signal) => '<article class="signal-card ' + signal.direction + '"><div class="signal-icon">' + signalLabels[signal.category][1] + '</div><div class="signal-main"><span>' + signalLabels[signal.category][0] + '</span><strong>' + signal.direction + '</strong><small>近14日 ' + signal.recent + ' 条 · 前期 ' + signal.previous + ' 条</small></div><div class="signal-score"><span>影响峰值</span><b>' + signal.maxScore + '</b></div></article>').join("");

    const sourceType = (item) => /^https?:\\/\\/[^/]*\\.gov(?:\\/|$)/i.test(item.link) ? "官方监管" : ["Old Dominion", "XPO", "Estes"].includes(item.source) ? "卡司公告" : ["FreightWaves", "FleetOwner"].includes(item.source) ? "行业媒体" : item.source === "TLI" ? "产业观察" : "公开信源";
    const whyItMatters = (item) => {
      const reason = item.whyItMatters || ((item.industryView.match(/^.*?[。！？]/) || [item.industryView])[0]);
      return Array.from(reason).length > 62 ? Array.from(reason).slice(0, 62).join("") + "…" : reason;
    };
    const grouped = new Map();
    newsItems.forEach((item) => grouped.set(itemDate(item), [...(grouped.get(itemDate(item)) || []), item]));
    const newsList = document.querySelector("[data-news-list]");
    if (newsList) newsList.innerHTML = [...grouped.entries()].map(([date, items]) => {
      const parts = date.split("-");
      const dateLabel = Number(parts[1]) + "月" + Number(parts[2]) + "日";
      const rows = items.map((item) => '<article class="news-row" data-category="' + escapeHtml(item.category) + '" data-title="' + escapeHtml(item.title) + '"><div class="news-meta"><span class="impact ' + escapeHtml(item.impact) + '">' + escapeHtml(item.impact) + '</span><span class="source-type">' + sourceType(item) + '</span><span>' + escapeHtml(item.source) + '</span><span>' + escapeHtml(item.dateType || "原文发布") + ' ' + escapeHtml(item.publishedAt) + '</span></div><div class="news-title-line"><h3>' + escapeHtml(item.title) + '</h3><div class="score" aria-label="重要性评分 ' + escapeHtml(item.score) + '"><strong>' + escapeHtml(item.score) + '</strong><span>影响</span></div></div><p class="why-line"><strong>为何值得看</strong><span>' + escapeHtml(whyItMatters(item)) + '</span></p><div class="news-copy"><p class="news-summary"><strong>原文摘要</strong><span>' + escapeHtml(item.summary) + '</span></p><p class="industry-view"><strong>行业看法</strong><span>' + escapeHtml(item.industryView) + '</span></p></div><div class="news-footer"><div class="tag-row">' + item.tags.map((tag) => '<span>#' + escapeHtml(tag) + '</span>').join("") + '</div><div class="news-actions">' + (item.relatedSources?.length ? '<span class="related-count">另有 ' + item.relatedSources.length + ' 家信源</span>' : '') + '<button aria-label="收藏资讯">☆</button><a href="' + escapeHtml(item.link) + '" target="_blank" rel="noreferrer">阅读原文 <span>↗</span></a></div></div></article>').join("");
      return '<details class="date-group" open><summary><div><time datetime="' + escapeHtml(date) + '">' + dateLabel + '</time><span>' + escapeHtml(items[0].publishedDay) + '</span></div><div><b>' + items.length + '</b> 条精选 <i>⌄</i></div></summary><div class="date-items">' + rows + '</div></details>';
    }).join("");
    const salesTips = document.querySelector("[data-news-sales-tips]");
    if (salesTips) salesTips.innerHTML = data.salesTips.map((tip, index) => '<li><b>' + String(index + 1).padStart(2, "0") + '</b><div><strong>' + escapeHtml(tip.title) + '</strong><p>' + escapeHtml(tip.summary) + '</p></div></li>').join("");
    document.querySelectorAll(".topic-list button[data-filter]").forEach((button) => {
      const count = newsItems.filter((item) => item.category === button.dataset.filter).length;
      const badge = button.querySelector("b");
      if (badge) badge.textContent = count;
    });
    document.querySelectorAll(".filter-row button[data-filter]").forEach((button) => {
      const count = button.dataset.filter === "全部" ? newsItems.length : newsItems.filter((item) => item.category === button.dataset.filter).length;
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
  let savedOnly = false;
  let savedTitles = [];
  try { savedTitles = JSON.parse(localStorage.getItem("kaka-news-bookmarks") || "[]"); } catch { savedTitles = []; }
  const updateSavedCount = () => {
    const badge = document.querySelector(".nav-action b");
    if (badge) badge.textContent = savedTitles.length;
  };
  updateSavedCount();
  const apply = () => {
    const query = (input?.value || "").trim().toLowerCase();
    document.querySelectorAll(".news-row").forEach((row) => {
      const categoryMatches = active === "全部" || row.dataset.category === active;
      const queryMatches = !query || (row.textContent || "").toLowerCase().includes(query);
      const savedMatches = !savedOnly || savedTitles.includes(row.dataset.title);
      row.style.display = categoryMatches && queryMatches && savedMatches ? "" : "none";
    });
    document.querySelectorAll(".date-group").forEach((group) => {
      group.style.display = [...group.querySelectorAll(".news-row")].some((row) => row.style.display !== "none") ? "" : "none";
    });
  };
  buttons.forEach((button) => button.addEventListener("click", () => {
    active = button.dataset.filter || "全部";
    savedOnly = false;
    buttons.forEach((item) => item.classList.toggle("active", item === button));
    topicButtons.forEach((item) => item.classList.toggle("active", item.dataset.filter === active));
    apply();
  }));
  topicButtons.forEach((button) => button.addEventListener("click", () => {
    active = button.dataset.filter || "全部";
    savedOnly = false;
    if (input) input.value = "";
    buttons.forEach((item) => item.classList.toggle("active", item.textContent?.trim() === active));
    topicButtons.forEach((item) => item.classList.toggle("active", item === button));
    apply();
    document.querySelector("#news")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
  input?.addEventListener("input", () => { savedOnly = false; apply(); });
  document.querySelector(".nav-action")?.addEventListener("click", () => {
    active = "全部";
    savedOnly = true;
    if (input) input.value = "";
    buttons.forEach((item) => item.classList.remove("active"));
    apply();
    document.querySelector("#news")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  document.querySelectorAll(".news-actions button").forEach((button) => {
    button.addEventListener("click", () => {
      const title = button.closest(".news-row")?.dataset.title;
      if (!title) return;
      savedTitles = savedTitles.includes(title) ? savedTitles.filter((item) => item !== title) : [...savedTitles, title];
      try { localStorage.setItem("kaka-news-bookmarks", JSON.stringify(savedTitles)); } catch {}
      updateSavedCount();
      button.classList.toggle("saved", savedTitles.includes(title));
      button.textContent = savedTitles.includes(title) ? "★" : "☆";
      if (savedOnly) apply();
    });
  });
  document.querySelectorAll(".news-row").forEach((row) => {
    const button = row.querySelector(".news-actions button");
    if (button && savedTitles.includes(row.dataset.title)) { button.classList.add("saved"); button.textContent = "★"; }
  });
})();
</script>`;

await writeFile(new URL("./index.html", import.meta.url), html.replace("</body>", `${interactions}</body>`), "utf8");
process.stdout.write("GitHub Pages index.html exported.\n");
