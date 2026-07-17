import worker from "./dist/server/index.js";

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
  .replace(/<link rel="stylesheet"[^>]*>/, '<link rel="stylesheet" href="./styles.css">');

const interactions = `<script>
(() => {
  const rows = [...document.querySelectorAll(".news-row")];
  const buttons = [...document.querySelectorAll(".filter-row button")];
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
    apply();
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
