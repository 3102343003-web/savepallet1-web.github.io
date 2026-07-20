import { readFile } from "node:fs/promises";

const dataUrl = new URL("../public/data/news.json", import.meta.url);
const data = JSON.parse(await readFile(dataUrl, "utf8"));
const errors = [];

if (data.schemaVersion !== 1) errors.push("schemaVersion 必须为 1");
if (!Array.isArray(data.newsItems) || data.newsItems.length === 0) errors.push("newsItems 不能为空");
if (!Array.isArray(data.topStories) || data.topStories.length !== 3) errors.push("topStories 必须正好有 3 条");
if (!Array.isArray(data.salesTips) || data.salesTips.length !== 3) errors.push("salesTips 必须正好有 3 条");

const links = new Set();
let previousDate = "9999-12-31";
for (const [index, item] of (data.newsItems ?? []).entries()) {
  const label = `第 ${index + 1} 条资讯`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(item.publishedDate ?? "")) errors.push(`${label}发布日期格式错误`);
  if (item.publishedDate > previousDate) errors.push(`${label}未按发布日期倒序排列`);
  previousDate = item.publishedDate;
  if (!/^https?:\/\//.test(item.link ?? "")) errors.push(`${label}缺少具体原文链接`);
  if (/\/news\/category\//.test(item.link ?? "")) errors.push(`${label}使用了栏目链接而非具体原文链接`);
  if (links.has(item.link)) errors.push(`${label}原文链接重复`);
  links.add(item.link);
  if (!item.title || !item.summary || !item.industryView) errors.push(`${label}缺少标题、摘要或行业看法`);
  if (!Array.isArray(item.tags) || item.tags.length === 0) errors.push(`${label}缺少标签`);
  if (!Number.isInteger(item.score) || item.score < 0 || item.score > 100) errors.push(`${label}重要性评分无效`);
}

if (errors.length) {
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(`资讯数据有效：${data.newsItems.length} 条资讯，${links.size} 个具体原文链接。`);
}
