"use client";

import { useEffect, useMemo, useState } from "react";
import initialNewsData from "../public/data/news.json";

type NewsItem = {
  publishedDate: string;
  publishedAt: string;
  publishedDay: string;
  source: string;
  score: number;
  title: string;
  summary: string;
  industryView: string;
  category: string;
  impact: "利好" | "关注" | "风险";
  tags: string[];
  link: string;
};

type NewsData = {
  schemaVersion: number;
  edition: {
    date: string;
    weekday: string;
    issue: string;
    updatedAt: string;
    windowDays: number;
    nextUpdate: string;
  };
  brief: {
    title: string;
    summary: string;
    marketTemperature: string;
    readingMinutes: number;
  };
  topStories: Array<{
    rank: string;
    category: string;
    title: string;
    summary: string;
    signal: string;
    signalText: string;
    tone: string;
  }>;
  salesTips: Array<{ title: string; summary: string }>;
  sources: string[];
  newsItems: NewsItem[];
};

type CompetitorChannel = {
  label: string;
  href?: string;
};

const competitors = [
  { name: "省多多", level: "A级", initials: "省", color: "#f97316", wechatName: "省多多北美卡车平台", update: "小红书、抖音主页已接入；公众号与视频号入口待补充", insight: "销售可直接进入已核验的竞对主页；公开内容仍按近 30 天范围监控。", channels: [{ label: "公众号" }, { label: "官网", href: "http://sddltl.com/Default.aspx" }, { label: "小红书", href: "https://xhslink.com/m/75sNtVt2wwW" }, { label: "视频号" }, { label: "抖音", href: "https://v.douyin.com/xEe-XTIB5VA" }] satisfies CompetitorChannel[], link: "http://sddltl.com/Default.aspx" },
  { name: "货马达", level: "A级", initials: "货", color: "#2563eb", wechatName: "货马达美国卡车运输平台", update: "近 30 天暂无可公开验证的公众号更新", insight: "账号主页链接待补充，暂不绑定未经核验的同名账号。", channels: [{ label: "公众号" }, { label: "官网", href: "https://www.hmd-truck.com" }, { label: "小红书" }, { label: "视频号" }, { label: "抖音" }] satisfies CompetitorChannel[], link: "https://www.hmd-truck.com" },
];

const isWithinDataWindow = (publishedDate: string, referenceDate: string, windowDays: number) => {
  const publishedAt = new Date(`${publishedDate}T23:59:59Z`).getTime();
  const referenceAt = new Date(`${referenceDate}T23:59:59Z`).getTime();
  const age = referenceAt - publishedAt;
  return age >= 0 && age <= windowDays * 24 * 60 * 60 * 1000;
};

const filters = ["全部", "市场运价", "法规合规", "公司动态", "司机与车队", "新能源"];
const topics = [
  { label: "运价与货量", filter: "市场运价", dot: "red" },
  { label: "FMCSA 合规", filter: "法规合规", dot: "blue" },
  { label: "倒闭与裁员", filter: "公司动态", dot: "amber" },
  { label: "新能源卡车", filter: "新能源", dot: "green" },
];

export default function Home() {
  const [content, setContent] = useState<NewsData>(initialNewsData as NewsData);
  const [activeFilter, setActiveFilter] = useState("全部");
  const [query, setQuery] = useState("");
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const windowNews = useMemo(
    () => content.newsItems.filter((item) => isWithinDataWindow(item.publishedDate, content.edition.date, content.edition.windowDays)),
    [content.edition.date, content.edition.windowDays, content.newsItems],
  );
  const visibleNews = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return windowNews.filter((item) => (activeFilter === "全部" || item.category === activeFilter) && (!keyword || `${item.title}${item.summary}${item.industryView}${item.tags.join("")}`.toLowerCase().includes(keyword)));
  }, [activeFilter, query, windowNews]);
  useEffect(() => {
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
    return () => controller.abort();
  }, []);
  const toggleBookmark = (title: string) => setBookmarked((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);
  const selectTopic = (filter: string) => {
    setActiveFilter(filter);
    setQuery("");
    requestAnimationFrame(() => document.getElementById("news")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">卡</div><div><strong>卡卡省</strong><span>美国卡派情报站</span></div></div>
        <nav className="nav-list" aria-label="主导航">
          <a className="nav-item active" href="#today"><span>⌂</span>今日精选</a>
          <a className="nav-item" href="#news"><span>▤</span>全部动态</a>
          <a className="nav-item" href="#brief"><span>◫</span>每日晨报</a>
          <a className="nav-item" href="#topics"><span>◎</span>主题追踪</a>
          <a className="nav-item" href="#competitors"><span>◈</span>竞对监控</a>
          <a className="nav-item" href="#bookmarks"><span>☆</span>我的收藏 <b>{bookmarked.length}</b></a>
        </nav>
        <div className="sidebar-label">重点专题</div>
        <div className="topic-list">
          {topics.map((topic) => {
            const count = windowNews.filter((item) => item.category === topic.filter).length;
            return <button className={activeFilter === topic.filter ? "active" : ""} data-filter={topic.filter} onClick={() => selectTopic(topic.filter)} aria-pressed={activeFilter === topic.filter} title={`筛选${topic.label}专题`} key={topic.label}><i className={`dot ${topic.dot}`} /><span>{topic.label}</span><b>{count}</b></button>;
          })}
        </div>
        <div className="sidebar-foot"><div className="status-line"><i />数据源运行正常</div><p>工作日 09:00 前更新</p><small>版本 1.0 · 公开资讯服务</small></div>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <div><div className="eyebrow" data-news-edition>{content.edition.weekday} · {content.edition.date.replaceAll("-", ".")}</div><h1>美国卡车运输情报</h1></div>
          <label className="search-box"><span>⌕</span><input aria-label="搜索资讯" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司、政策、线路或关键词" /><kbd>⌘ K</kbd></label>
          <div className="topbar-actions"><button className="icon-button" aria-label="邮件通知">✉</button><div className="update-pill"><i />已更新 <strong data-news-updated>{content.edition.updatedAt}</strong></div></div>
        </header>

        <div className="workspace">
          <div className="main-column">
            <section className="morning-brief" id="today">
              <div className="brief-copy"><div className="brief-kicker" data-news-issue>KAKA MORNING BRIEF · 第 {content.edition.issue} 期</div><h2 data-news-brief-title>{content.brief.title}</h2><p data-news-brief-summary>{content.brief.summary}</p><div className="brief-actions"><a href="#news" className="primary-button">阅读完整晨报 <span>→</span></a><span data-news-reading>预计阅读 {content.brief.readingMinutes} 分钟</span></div></div>
              <div className="brief-metrics"><div><span>近 {content.edition.windowDays} 天精选</span><strong data-news-count>{windowNews.length}</strong><small>条可追溯资讯</small></div><div><span>市场温度</span><strong className="warm" data-news-temperature>{content.brief.marketTemperature}</strong><small>综合近月信号</small></div><div><span>风险事件</span><strong className="risk" data-news-risk-count>{String(windowNews.filter((item) => item.impact === "风险").length).padStart(2, "0")}</strong><small>需销售关注</small></div><div><span>竞对公众号</span><strong>00</strong><small>近 {content.edition.windowDays} 天可验证</small></div></div>
            </section>

            <section className="section-block" id="brief">
              <div className="section-heading"><div><span className="section-index">01</span><h2>今日热点 TOP 3</h2></div><span className="section-note">近 {content.edition.windowDays} 天数据 · 基于时效、行业影响与销售价值排序</span></div>
              <div className="top-story-grid" data-news-top-stories>{content.topStories.map((story) => <article className={`top-story ${story.tone}`} key={story.rank}><div className="story-meta"><span>{story.rank}</span><b>{story.category}</b></div><h3>{story.title}</h3><p>{story.summary}</p><div className="story-signal"><span>{story.signal}</span><strong>{story.signalText}</strong></div></article>)}</div>
            </section>

            <section className="section-block" id="news">
              <div className="section-heading news-heading"><div><span className="section-index">02</span><h2>最新精选</h2><span className="range-chip">仅近 {content.edition.windowDays} 天</span></div><a href="https://www.freightwaves.com/news/category/news/trucking" target="_blank" rel="noreferrer">查看 FreightWaves 主来源 ↗</a></div>
              <div className="filter-row" id="topics">{filters.map((filter) => <button className={filter === activeFilter ? "active" : ""} onClick={() => setActiveFilter(filter)} key={filter}>{filter}</button>)}</div>
              <div className="news-list" data-news-list>
                {visibleNews.map((item) => <article className="news-row" data-category={item.category} key={item.title}><div className="news-time"><em>原文发布</em><strong>{item.publishedAt}</strong><small>{item.publishedDay}</small><span>{item.source}</span></div><div className="score" aria-label={`重要性评分 ${item.score}`}><strong>{item.score}</strong><span>重要性</span></div><div className="news-body"><div className="news-title-line"><span className={`impact ${item.impact}`}>{item.impact}</span><h3>{item.title}</h3></div><div className="news-copy"><p className="news-summary"><strong>原文摘要</strong><span>{item.summary}</span></p><p className="industry-view"><strong>行业看法</strong><span>{item.industryView}</span></p></div><div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></div><div className="news-actions"><button className={bookmarked.includes(item.title) ? "saved" : ""} onClick={() => toggleBookmark(item.title)} aria-label="收藏资讯">{bookmarked.includes(item.title) ? "★" : "☆"}</button><a href={item.link} target="_blank" rel="noreferrer">原文 ↗</a></div></article>)}
                {visibleNews.length === 0 && <div className="empty-state">没有找到匹配的资讯，请更换关键词或分类。</div>}
              </div>
            </section>
          </div>

          <aside className="right-rail" id="competitors">
            <section className="rail-card competitor-card"><div className="rail-heading"><div><span className="live-dot" />竞对动态监控</div><button aria-label="更多竞对">•••</button></div><p className="rail-subtitle">2 家 A 级竞对 · 监控范围近 30 天</p><div className="competitor-list">{competitors.map((company) => <article key={company.name}><div className="company-head"><span className="company-avatar" style={{ background: company.color }}>{company.initials}</span><div><strong>{company.name}</strong><span>{company.level}重点监控</span></div><a href={company.link} target="_blank" rel="noreferrer">官网 ↗</a></div><div className="account-line"><span>微信公众号</span><strong>{company.wechatName}</strong></div><h3 className="monitor-status">{company.update}</h3><p>{company.insight}</p><div className="channel-row">{company.channels.map((channel) => channel.href ? <a href={channel.href} target="_blank" rel="noreferrer" title={`打开${company.name}${channel.label}主页`} key={channel.label}>{channel.label} ↗</a> : <span className="unavailable" title="入口待补充" key={channel.label}>{channel.label} · 待补</span>)}</div></article>)}</div><button className="outline-button">查看全部竞对动态 <span>→</span></button></section>
            <section className="rail-card sales-card"><div className="rail-heading"><div>今日销售提示</div><span>AI</span></div><ol data-news-sales-tips>{content.salesTips.map((tip, index) => <li key={tip.title}><b>{String(index + 1).padStart(2, "0")}</b><div><strong>{tip.title}</strong><p>{tip.summary}</p></div></li>)}</ol></section>
            <section className="rail-card source-card"><div className="rail-heading"><div>数据与版权说明</div></div><p>受版权限制的来源仅展示中文摘要与原文链接，不转载全文或图片。</p><div><span>主要来源</span><strong data-news-sources>{content.sources.join("、")}</strong></div><div><span>抓取窗口</span><strong>近 {content.edition.windowDays} 天</strong></div><div><span>历史保留</span><strong>365 天</strong></div><div><span>下次更新</span><strong data-news-next-update>{content.edition.nextUpdate}</strong></div></section>
          </aside>
        </div>
      </section>
    </main>
  );
}
