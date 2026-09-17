"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import initialNewsData from "../public/data/news.json";

type RelatedSource = { name: string; link: string };

type NewsItem = {
  publishedDate: string;
  updatedDate?: string;
  effectiveDate?: string;
  dateType?: string;
  publishedAt: string;
  publishedDay: string;
  source: string;
  score: number;
  title: string;
  summary: string;
  industryView: string;
  whyItMatters?: string;
  category: string;
  impact: "利好" | "关注" | "风险";
  tags: string[];
  link: string;
  relatedSources?: RelatedSource[];
};

type NewsData = {
  schemaVersion: number;
  edition: { date: string; weekday: string; issue: string; updatedAt: string; windowDays: number; nextUpdate: string };
  brief: { title: string; summary: string; marketTemperature: string; readingMinutes: number };
  topStories: Array<{ rank: string; category: string; title: string; summary: string; signal: string; signalText: string; tone: string }>;
  salesTips: Array<{ title: string; summary: string }>;
  sources: string[];
  newsItems: NewsItem[];
};

type CompetitorChannel = { label: string; href?: string };

const competitors = [
  { name: "省多多", level: "A级", initials: "省", color: "#f97316", wechatName: "省多多北美卡车平台", update: "小红书、抖音主页已接入；公众号与视频号入口待补充", insight: "销售可直接进入已核验的竞对主页；公开内容仍按近 30 天范围监控。", channels: [{ label: "公众号" }, { label: "官网", href: "http://sddltl.com/Default.aspx" }, { label: "小红书", href: "https://xhslink.com/m/75sNtVt2wwW" }, { label: "视频号" }, { label: "抖音", href: "https://v.douyin.com/xEe-XTIB5VA" }] satisfies CompetitorChannel[], link: "http://sddltl.com/Default.aspx" },
  { name: "货马达", level: "A级", initials: "货", color: "#2563eb", wechatName: "货马达美国卡车运输平台", update: "近 30 天暂无可公开验证的公众号更新", insight: "账号主页链接待补充，暂不绑定未经核验的同名账号。", channels: [{ label: "公众号" }, { label: "官网", href: "https://www.hmd-truck.com" }, { label: "小红书" }, { label: "视频号" }, { label: "抖音" }] satisfies CompetitorChannel[], link: "https://www.hmd-truck.com" },
];

const filters = ["全部", "市场运价", "法规合规", "经纪责任", "承运商风险", "公司动态", "司机与车队", "新能源"];
const topics = [
  { label: "运价与货量", filter: "市场运价", dot: "red" },
  { label: "FMCSA 合规", filter: "法规合规", dot: "blue" },
  { label: "经纪责任", filter: "经纪责任", dot: "violet" },
  { label: "承运商风险", filter: "承运商风险", dot: "amber" },
  { label: "新能源卡车", filter: "新能源", dot: "green" },
];

const signalMeta: Record<string, { short: string; icon: string }> = {
  市场运价: { short: "运价与货量", icon: "↗" },
  法规合规: { short: "监管与合规", icon: "§" },
  经纪责任: { short: "经纪责任", icon: "⚖" },
  承运商风险: { short: "承运商风险", icon: "!" },
  公司动态: { short: "企业经营", icon: "▦" },
  司机与车队: { short: "司机与运力", icon: "◇" },
  新能源: { short: "新能源", icon: "⌁" },
};

const getItemDate = (item: NewsItem) => item.publishedDate || item.updatedDate || item.effectiveDate || "";

const isWithinDataWindow = (itemDate: string, referenceDate: string, windowDays: number) => {
  const publishedAt = new Date(`${itemDate}T23:59:59Z`).getTime();
  const referenceAt = new Date(`${referenceDate}T23:59:59Z`).getTime();
  const age = referenceAt - publishedAt;
  return age >= 0 && age <= windowDays * 24 * 60 * 60 * 1000;
};

const getWhyItMatters = (item: NewsItem) => {
  if (item.whyItMatters) return item.whyItMatters;
  const firstSentence = item.industryView.match(/^.*?[。！？]/)?.[0] ?? item.industryView;
  const characters = Array.from(firstSentence);
  return characters.length > 62 ? `${characters.slice(0, 62).join("")}…` : firstSentence;
};

const getSourceType = (item: NewsItem) => {
  if (/^https?:\/\/[^/]*\.gov(?:\/|$)/i.test(item.link)) return "官方监管";
  if (["Old Dominion", "XPO", "Estes"].includes(item.source)) return "卡司公告";
  if (["FreightWaves", "FleetOwner"].includes(item.source)) return "行业媒体";
  if (item.source === "TLI") return "产业观察";
  return "公开信源";
};

const formatDateLabel = (date: string) => {
  const [, month, day] = date.split("-");
  return `${Number(month)}月${Number(day)}日`;
};

export default function Home() {
  const [content, setContent] = useState<NewsData>(initialNewsData as NewsData);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [query, setQuery] = useState("");
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const [savedOnly, setSavedOnly] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const windowNews = useMemo(
    () => content.newsItems.filter((item) => isWithinDataWindow(getItemDate(item), content.edition.date, content.edition.windowDays)),
    [content.edition.date, content.edition.windowDays, content.newsItems],
  );

  const visibleNews = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return windowNews.filter((item) => {
      const categoryMatches = activeFilter === "全部" || item.category === activeFilter;
      const queryMatches = !keyword || `${item.title}${item.summary}${item.industryView}${item.tags.join("")}`.toLowerCase().includes(keyword);
      const savedMatches = !savedOnly || bookmarked.includes(item.title);
      return categoryMatches && queryMatches && savedMatches;
    });
  }, [activeFilter, bookmarked, query, savedOnly, windowNews]);

  const groupedNews = useMemo(() => {
    const groups = new Map<string, NewsItem[]>();
    visibleNews.forEach((item) => {
      const itemDate = getItemDate(item);
      groups.set(itemDate, [...(groups.get(itemDate) ?? []), item]);
    });
    return [...groups.entries()];
  }, [visibleNews]);

  const trendSignals = useMemo(() => {
    const referenceAt = new Date(`${content.edition.date}T23:59:59Z`).getTime();
    return Object.keys(signalMeta)
      .map((category) => {
        const items = windowNews.filter((item) => item.category === category);
        const ages = items.map((item) => Math.floor((referenceAt - new Date(`${getItemDate(item)}T23:59:59Z`).getTime()) / 86400000));
        const recent = ages.filter((age) => age >= 0 && age < 14).length;
        const previous = ages.filter((age) => age >= 14 && age < 28).length;
        const direction = recent > previous ? "升温" : recent < previous ? "回落" : "稳定";
        const maxScore = items.reduce((highest, item) => Math.max(highest, item.score), 0);
        const riskCount = items.filter((item) => item.impact === "风险").length;
        return { category, items, recent, previous, direction, maxScore, riskCount, weight: maxScore + riskCount * 6 + recent * 4 };
      })
      .filter((signal) => signal.items.length > 0)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 4);
  }, [content.edition.date, windowNews]);

  useEffect(() => {
    const storageTimer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem("kaka-news-bookmarks");
        if (stored) setBookmarked(JSON.parse(stored));
      } catch {
        // Storage can be unavailable in privacy-restricted browsers.
      }
    }, 0);

    const controller = new AbortController();
    fetch("./data/news.json", { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`资讯数据读取失败：${response.status}`);
        return response.json() as Promise<NewsData>;
      })
      .then((data) => {
        if (data.schemaVersion === 1 && Array.isArray(data.newsItems)) setContent(data);
      })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) console.warn(error);
      });

    const focusSearch = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", focusSearch);
    return () => {
      window.clearTimeout(storageTimer);
      controller.abort();
      window.removeEventListener("keydown", focusSearch);
    };
  }, []);

  const toggleBookmark = (title: string) => {
    setBookmarked((current) => {
      const next = current.includes(title) ? current.filter((item) => item !== title) : [...current, title];
      try { window.localStorage.setItem("kaka-news-bookmarks", JSON.stringify(next)); } catch { /* no-op */ }
      return next;
    });
  };

  const selectTopic = (filter: string) => {
    setActiveFilter(filter);
    setSavedOnly(false);
    setQuery("");
    requestAnimationFrame(() => document.getElementById("news")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const showBookmarks = () => {
    setSavedOnly(true);
    setActiveFilter("全部");
    setQuery("");
    requestAnimationFrame(() => document.getElementById("news")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">卡</div><div><strong>卡卡省</strong><span>KAKA INTELLIGENCE</span></div></div>
        <nav className="nav-list" aria-label="主导航">
          <a className="nav-item active" href="#today"><span>⌂</span>今日总览</a>
          <a className="nav-item" href="#signals"><span>⌁</span>影响趋势</a>
          <a className="nav-item" href="#news"><span>▤</span>最新动态</a>
          <a className="nav-item" href="#sales"><span>◎</span>销售行动</a>
          <a className="nav-item" href="#competitors"><span>◈</span>竞对监控</a>
          <button className={`nav-item nav-action ${savedOnly ? "active" : ""}`} onClick={showBookmarks} id="bookmarks"><span>☆</span>我的收藏 <b>{bookmarked.length}</b></button>
        </nav>
        <div className="sidebar-label">重点专题</div>
        <div className="topic-list">
          {topics.map((topic) => {
            const count = windowNews.filter((item) => item.category === topic.filter).length;
            return <button className={activeFilter === topic.filter && !savedOnly ? "active" : ""} data-filter={topic.filter} onClick={() => selectTopic(topic.filter)} aria-pressed={activeFilter === topic.filter && !savedOnly} title={`筛选${topic.label}专题`} key={topic.label}><i className={`dot ${topic.dot}`} /><span>{topic.label}</span><b>{count}</b></button>;
          })}
        </div>
        <div className="sidebar-foot"><div className="status-line"><i />情报源运行正常</div><p>工作日 10:00 更新</p><small>公开资讯 · 原文可追溯</small></div>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <div className="page-title"><div className="eyebrow" data-news-edition>{content.edition.weekday} · {content.edition.date.replaceAll("-", ".")}</div><h1>美国卡派情报</h1></div>
          <label className="search-box"><span>⌕</span><input ref={searchRef} aria-label="搜索资讯" value={query} onChange={(event) => { setQuery(event.target.value); setSavedOnly(false); }} placeholder="搜索公司、政策、线路或关键词" /><kbd>⌘ K</kbd></label>
          <div className="topbar-actions"><div className="update-pill"><i />已更新 <strong data-news-updated>{content.edition.updatedAt}</strong></div></div>
        </header>

        <div className="workspace">
          <div className="main-column">
            <section className="morning-brief" id="today">
              <div className="brief-copy"><div className="brief-kicker" data-news-issue>KAKA MORNING BRIEF · 第 {content.edition.issue} 期</div><h2 data-news-brief-title>{content.brief.title}</h2><p data-news-brief-summary>{content.brief.summary}</p><div className="brief-actions"><a href="#news" className="primary-button">查看今日情报 <span>→</span></a><span data-news-reading>预计阅读 {content.brief.readingMinutes} 分钟</span></div></div>
              <div className="brief-metrics"><div><span>近 {content.edition.windowDays} 天精选</span><strong data-news-count>{windowNews.length}</strong><small>条可追溯资讯</small></div><div><span>市场温度</span><strong className="warm" data-news-temperature>{content.brief.marketTemperature}</strong><small>综合近月信号</small></div><div><span>风险事件</span><strong className="risk" data-news-risk-count>{String(windowNews.filter((item) => item.impact === "风险").length).padStart(2, "0")}</strong><small>需销售关注</small></div><div><span>今日重点</span><strong>{String(content.topStories.length).padStart(2, "0")}</strong><small>已完成编辑筛选</small></div></div>
            </section>

            <section className="section-block" id="brief">
              <div className="section-heading"><div><span className="section-index">01</span><div><h2>今日热点 TOP 3</h2><p>先看最可能影响报价、运力与履约的三件事</p></div></div><span className="section-note">编辑精选 · 非热搜排序</span></div>
              <div className="top-story-grid" data-news-top-stories>{content.topStories.map((story) => <article className={`top-story ${story.tone}`} key={story.rank}><div className="story-meta"><span>{story.rank}</span><b>{story.category}</b></div><h3>{story.title}</h3><p>{story.summary}</p><div className="story-signal"><span>{story.signal}</span><strong>{story.signalText}</strong></div></article>)}</div>
            </section>

            <section className="section-block" id="signals">
              <div className="section-heading"><div><span className="section-index">02</span><div><h2>卡派影响趋势</h2><p>用近 14 日与前 14 日新增量判断主题变化</p></div></div><span className="section-note">不是社交热度，而是业务影响</span></div>
              <div className="signal-grid">{trendSignals.map((signal) => { const meta = signalMeta[signal.category]; return <article className={`signal-card ${signal.direction}`} key={signal.category}><div className="signal-icon">{meta.icon}</div><div className="signal-main"><span>{meta.short}</span><strong>{signal.direction}</strong><small>近14日 {signal.recent} 条 · 前期 {signal.previous} 条</small></div><div className="signal-score"><span>影响峰值</span><b>{signal.maxScore}</b></div></article>; })}</div>
            </section>

            <section className="section-block" id="news">
              <div className="section-heading news-heading"><div><span className="section-index">03</span><div><h2>{savedOnly ? "我的收藏" : "最新精选"}</h2><p>{savedOnly ? `已收藏 ${bookmarked.length} 条资讯` : "按原文发布或页面更新日期归档，同日资讯集中浏览"}</p></div><span className="range-chip">仅近 {content.edition.windowDays} 天</span></div><a href="https://www.freightwaves.com/news/category/news/trucking" target="_blank" rel="noreferrer">FreightWaves 综合源 ↗</a></div>
              <div className="filter-row" id="topics">{filters.map((filter) => { const count = filter === "全部" ? windowNews.length : windowNews.filter((item) => item.category === filter).length; return <button data-filter={filter} className={filter === activeFilter && !savedOnly ? "active" : ""} onClick={() => { setActiveFilter(filter); setSavedOnly(false); }} key={filter}>{filter}<b>{count}</b></button>; })}</div>
              <div className="news-list" data-news-list>
                {groupedNews.map(([date, items]) => <details className="date-group" open key={date}>
                  <summary><div><time dateTime={date}>{formatDateLabel(date)}</time><span>{items[0].publishedDay}</span></div><div><b>{items.length}</b> 条精选 <i>⌄</i></div></summary>
                  <div className="date-items">{items.map((item) => <article className="news-row" data-category={item.category} data-title={item.title} key={item.title}>
                    <div className="news-meta"><span className={`impact ${item.impact}`}>{item.impact}</span><span className="source-type">{getSourceType(item)}</span><span>{item.source}</span><span>{item.dateType ?? "原文发布"} {item.publishedAt}</span></div>
                    <div className="news-title-line"><h3>{item.title}</h3><div className="score" aria-label={`重要性评分 ${item.score}`}><strong>{item.score}</strong><span>影响</span></div></div>
                    <p className="why-line"><strong>为何值得看</strong><span>{getWhyItMatters(item)}</span></p>
                    <div className="news-copy"><p className="news-summary"><strong>原文摘要</strong><span>{item.summary}</span></p><p className="industry-view"><strong>行业看法</strong><span>{item.industryView}</span></p></div>
                    <div className="news-footer"><div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div><div className="news-actions">{item.relatedSources && item.relatedSources.length > 0 && <span className="related-count">另有 {item.relatedSources.length} 家信源</span>}<button className={bookmarked.includes(item.title) ? "saved" : ""} onClick={() => toggleBookmark(item.title)} aria-label={bookmarked.includes(item.title) ? "取消收藏" : "收藏资讯"}>{bookmarked.includes(item.title) ? "★" : "☆"}</button><a href={item.link} target="_blank" rel="noreferrer">阅读原文 <span>↗</span></a></div></div>
                  </article>)}</div>
                </details>)}
                {visibleNews.length === 0 && <div className="empty-state"><strong>{savedOnly ? "还没有收藏资讯" : "没有找到匹配的资讯"}</strong><span>{savedOnly ? "点击资讯右下角的星标即可保存到这里。" : "请更换关键词或分类后重试。"}</span></div>}
              </div>
            </section>
          </div>

          <aside className="right-rail" id="competitors">
            <section className="rail-card action-card" id="sales"><div className="rail-heading"><div><span className="live-dot" />今日销售行动</div><span className="ai-badge">ACTION</span></div><ol data-news-sales-tips>{content.salesTips.map((tip, index) => <li key={tip.title}><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{tip.title}</strong><p>{tip.summary}</p></div></li>)}</ol></section>
            <section className="rail-card competitor-card"><div className="rail-heading"><div>竞对动态监控</div><span className="rail-count">2 家重点</span></div><p className="rail-subtitle">公开主页与近 {content.edition.windowDays} 天内容</p><div className="competitor-list">{competitors.map((company) => <article key={company.name}><div className="company-head"><span className="company-avatar" style={{ background: company.color }}>{company.initials}</span><div><strong>{company.name}</strong><span>{company.level}重点监控</span></div><a href={company.link} target="_blank" rel="noreferrer">官网 ↗</a></div><div className="account-line"><span>微信公众号</span><strong>{company.wechatName}</strong></div><h3 className="monitor-status">{company.update}</h3><p>{company.insight}</p><div className="channel-row">{company.channels.map((channel) => channel.href ? <a href={channel.href} target="_blank" rel="noreferrer" title={`打开${company.name}${channel.label}主页`} key={channel.label}>{channel.label} ↗</a> : <span className="unavailable" title="入口待补充" key={channel.label}>{channel.label} · 待补</span>)}</div></article>)}</div></section>
            <section className="rail-card source-card"><div className="rail-heading"><div>数据透明度</div><span className="verified-badge">可追溯</span></div><p>仅展示中文摘要与行业判断，版权内容请通过原文链接查看。</p><div><span>主要来源</span><strong data-news-sources>{content.sources.join("、")}</strong></div><div><span>观察窗口</span><strong>近 {content.edition.windowDays} 天</strong></div><div><span>排序依据</span><strong>业务影响优先</strong></div><div><span>下次更新</span><strong data-news-next-update>{content.edition.nextUpdate}</strong></div></section>
          </aside>
        </div>
      </section>
    </main>
  );
}
