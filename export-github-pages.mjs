import worker from "./dist/server/index.js";
import { readFile } from "node:fs/promises";

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
(() => {
  const rows = [...document.querySelectorAll(".news-row")];
  const buttons = [...document.querySelectorAll(".filter-row button")];
  const topicButtons = [...document.querySelectorAll(".topic-list button[data-filter]")];
  const input = document.querySelector(".search-box input");
  let active = "全部";
  const apply = () => {
    const query = (input?.value || "").trim().toLowerCase();
    rows.forEach((row) => {
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

process.stdout.write(html.replace("</body>", `${interactions}</body>`));
