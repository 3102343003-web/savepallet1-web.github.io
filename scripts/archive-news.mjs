import { readFile, writeFile } from "node:fs/promises";

const currentUrl = new URL("../public/data/news.json", import.meta.url);
const historyUrl = new URL("../public/data/history.json", import.meta.url);
const current = JSON.parse(await readFile(currentUrl, "utf8"));
let history = { schemaVersion: 1, retainedDays: 365, updatedAt: current.edition.date, newsItems: [] };

try {
  history = JSON.parse(await readFile(historyUrl, "utf8"));
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}

const cutoff = new Date(`${current.edition.date}T23:59:59Z`);
cutoff.setUTCDate(cutoff.getUTCDate() - 365);
const merged = new Map();
for (const item of [...current.newsItems, ...(history.newsItems ?? [])]) {
  if (new Date(`${item.publishedDate}T23:59:59Z`) >= cutoff && !merged.has(item.link)) merged.set(item.link, item);
}

history = {
  schemaVersion: 1,
  retainedDays: 365,
  updatedAt: current.edition.date,
  newsItems: [...merged.values()].sort((a, b) => b.publishedDate.localeCompare(a.publishedDate)),
};
await writeFile(historyUrl, `${JSON.stringify(history, null, 2)}\n`, "utf8");
console.log(`历史库已保留 ${history.newsItems.length} 条资讯。`);
