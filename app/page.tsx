"use client";

import { useMemo, useState } from "react";

type NewsItem = {
  publishedDate: string;
  publishedAt: string;
  publishedDay: string;
  source: string;
  score: number;
  title: string;
  summary: string;
  category: string;
  impact: "利好" | "关注" | "风险";
  tags: string[];
  link: string;
};

const topStories = [
  { rank: "01", category: "市场运价", title: "美国 TL、LTL 运价指数预计在第三季度刷新高位", summary: "二季度卡车运价指数明显上行，运力收紧与需求回升正在改变承运商议价能力。", signal: "销售机会", signalText: "提前锁定旺季线路与报价", tone: "blue" },
  { rank: "02", category: "合规监管", title: "美国多州扩大商用车辆与 CDL 执法检查", summary: "近期检查重点集中在驾驶资质、设备合规与承运商安全记录，异常运力面临退出风险。", signal: "风险提醒", signalText: "重新核验合作承运商资质", tone: "orange" },
  { rank: "03", category: "车队经营", title: "运输企业成本继续跑赢消费通胀", summary: "保险、设备、司机薪酬和维修费用仍在抬升，美国本土卡车运输报价承压。", signal: "客户沟通", signalText: "解释报价上涨的成本来源", tone: "violet" },
];

const newsItems: NewsItem[] = [
  { publishedDate: "2026-07-15", publishedAt: "07.15", publishedDay: "周三", source: "FreightWaves", score: 88, title: "美国卡车运输成本持续高于消费者通胀", summary: "最新行业成本研究显示，保险、人工与设备维护仍是主要压力。对中国跨境企业而言，美国尾程报价短期内难以明显回落。", category: "市场运价", impact: "关注", tags: ["运输成本", "保险", "车队"], link: "https://www.freightwaves.com/news/trucking-costs-outpaced-consumer-inflation-in-25-atri" },
  { publishedDate: "2026-07-14", publishedAt: "07.14", publishedDay: "周二", source: "FreightWaves", score: 84, title: "多家物流企业关闭与重组，行业运力继续出清", summary: "近期仓储关闭、破产申请与裁员事件延续。短期会带来局部线路运力波动，长期可能改善仍在经营的合规车队利润。", category: "公司动态", impact: "风险", tags: ["倒闭", "裁员", "运力"], link: "https://www.freightwaves.com/news/freight-distress-report-carrier-logistics-closures-erase-over-245-jobs" },
  { publishedDate: "2026-06-30", publishedAt: "06.30", publishedDay: "周二", source: "FreightWaves", score: 81, title: "美国监管部门加强商用车辆与驾驶资质检查", summary: "多个州近期扩大路检与称重站联合执法。无有效 CDL、设备记录异常或安全评分偏低的承运商面临停运风险。", category: "法规合规", impact: "风险", tags: ["FMCSA", "CDL", "路检"], link: "https://www.freightwaves.com/news/us-law-agencies-expand-crackdown-on-commercial-vehicle-violators" },
  { publishedDate: "2026-07-14", publishedAt: "07.14", publishedDay: "周二", source: "FreightWaves", score: 77, title: "美国司机薪酬指数近期明显上升", summary: "司机薪酬在过去两个月加速上涨，反映合格司机供给仍然偏紧。旺季前需关注长途线路与偏远区域的加价风险。", category: "司机与车队", impact: "关注", tags: ["司机", "薪酬", "旺季"], link: "https://www.freightwaves.com/news/index-of-driver-pay-product-of-two-companies-is-surging" },
  { publishedDate: "2026-06-26", publishedAt: "06.26", publishedDay: "周五", source: "FreightWaves", score: 74, title: "美国港口附近绿色卡车走廊项目继续推进", summary: "零排放卡车走廊正在连接主要港口与跨境节点，未来可能影响港区短驳设备、车队准入和相关附加费用。", category: "新能源", impact: "利好", tags: ["港口", "新能源", "短驳"], link: "https://www.freightwaves.com/news/port-of-long-beach-trucker-launch-zero-emission-corridor-to-mexico" },
];

const competitors = [
  { name: "省多多", level: "A级", initials: "省", color: "#f97316", wechatName: "省多多北美卡车平台", update: "近 30 天暂无可公开验证的公众号更新", insight: "已纳入监控；仅在能够核验发布日期与原文链接时展示文章。", channels: ["公众号", "官网", "小红书", "视频号", "抖音"], link: "http://sddltl.com/Default.aspx" },
  { name: "货马达", level: "A级", initials: "货", color: "#2563eb", wechatName: "货马达美国卡车运输平台", update: "近 30 天暂无可公开验证的公众号更新", insight: "已纳入监控；公开检索结果目前未发现近 30 天内的可追溯文章。", channels: ["公众号", "官网", "小红书", "视频号", "抖音"], link: "https://www.hmd-truck.com" },
];

const DATA_WINDOW_DAYS = 30;
const DATA_WINDOW_MS = DATA_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const isWithinDataWindow = (publishedDate: string) => {
  const age = Date.now() - new Date(`${publishedDate}T23:59:59Z`).getTime();
  return age >= 0 && age <= DATA_WINDOW_MS;
};

const filters = ["全部", "市场运价", "法规合规", "公司动态", "司机与车队", "新能源"];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("全部");
  const [query, setQuery] = useState("");
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const visibleNews = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return newsItems.filter((item) => isWithinDataWindow(item.publishedDate) && (activeFilter === "全部" || item.category === activeFilter) && (!keyword || `${item.title}${item.summary}${item.tags.join("")}`.toLowerCase().includes(keyword)));
  }, [activeFilter, query]);
  const toggleBookmark = (title: string) => setBookmarked((current) => current.includes(title) ? current.filter((item) => item !== title) : [...current, title]);

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
          <button><i className="dot red" />运价与货量</button><button><i className="dot blue" />FMCSA 合规</button><button><i className="dot amber" />倒闭与裁员</button><button><i className="dot green" />新能源卡车</button>
        </div>
        <div className="sidebar-foot"><div className="status-line"><i />数据源运行正常</div><p>工作日 09:00 前更新</p><small>版本 1.0 · 公开资讯服务</small></div>
      </aside>

      <section className="content-area">
        <header className="topbar">
          <div><div className="eyebrow">FRIDAY · 2026.07.17</div><h1>美国卡车运输情报</h1></div>
          <label className="search-box"><span>⌕</span><input aria-label="搜索资讯" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司、政策、线路或关键词" /><kbd>⌘ K</kbd></label>
          <div className="topbar-actions"><button className="icon-button" aria-label="邮件通知">✉</button><div className="update-pill"><i />已更新 <strong>08:42</strong></div></div>
        </header>

        <div className="workspace">
          <div className="main-column">
            <section className="morning-brief" id="today">
              <div className="brief-copy"><div className="brief-kicker">KAKA MORNING BRIEF · 第 001 期</div><h2>今日市场信号正在转强，<br />但合规风险同步上升。</h2><p>美国卡车运价、司机薪酬与运输成本继续抬升；多州加强商用车辆执法检查。建议销售优先跟进旺季备货客户，并提前说明合规运力的成本变化。</p><div className="brief-actions"><a href="#news" className="primary-button">阅读完整晨报 <span>→</span></a><span>预计阅读 6 分钟</span></div></div>
              <div className="brief-metrics"><div><span>近 30 天精选</span><strong>{visibleNews.length}</strong><small>条可追溯资讯</small></div><div><span>市场温度</span><strong className="warm">偏热</strong><small>综合近月信号</small></div><div><span>风险事件</span><strong className="risk">03</strong><small>需销售关注</small></div><div><span>竞对公众号</span><strong>00</strong><small>近 30 天可验证</small></div></div>
            </section>

            <section className="section-block" id="brief">
              <div className="section-heading"><div><span className="section-index">01</span><h2>今日热点 TOP 3</h2></div><span className="section-note">近 30 天数据 · 基于时效、行业影响与销售价值排序</span></div>
              <div className="top-story-grid">{topStories.map((story) => <article className={`top-story ${story.tone}`} key={story.rank}><div className="story-meta"><span>{story.rank}</span><b>{story.category}</b></div><h3>{story.title}</h3><p>{story.summary}</p><div className="story-signal"><span>{story.signal}</span><strong>{story.signalText}</strong></div></article>)}</div>
            </section>

            <section className="section-block" id="news">
              <div className="section-heading news-heading"><div><span className="section-index">02</span><h2>最新精选</h2><span className="range-chip">仅近 30 天</span></div><a href="https://www.freightwaves.com/news/category/news/trucking" target="_blank" rel="noreferrer">查看 FreightWaves 原站 ↗</a></div>
              <div className="filter-row" id="topics">{filters.map((filter) => <button className={filter === activeFilter ? "active" : ""} onClick={() => setActiveFilter(filter)} key={filter}>{filter}</button>)}</div>
              <div className="news-list">
                {visibleNews.map((item) => <article className="news-row" key={item.title}><div className="news-time"><em>原文发布</em><strong>{item.publishedAt}</strong><small>{item.publishedDay}</small><span>{item.source}</span></div><div className="score" aria-label={`重要性评分 ${item.score}`}><strong>{item.score}</strong><span>重要性</span></div><div className="news-body"><div className="news-title-line"><span className={`impact ${item.impact}`}>{item.impact}</span><h3>{item.title}</h3></div><p>{item.summary}</p><div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></div><div className="news-actions"><button className={bookmarked.includes(item.title) ? "saved" : ""} onClick={() => toggleBookmark(item.title)} aria-label="收藏资讯">{bookmarked.includes(item.title) ? "★" : "☆"}</button><a href={item.link} target="_blank" rel="noreferrer">原文 ↗</a></div></article>)}
                {visibleNews.length === 0 && <div className="empty-state">没有找到匹配的资讯，请更换关键词或分类。</div>}
              </div>
            </section>
          </div>

          <aside className="right-rail" id="competitors">
            <section className="rail-card competitor-card"><div className="rail-heading"><div><span className="live-dot" />竞对动态监控</div><button aria-label="更多竞对">•••</button></div><p className="rail-subtitle">2 家 A 级竞对 · 监控范围近 30 天</p><div className="competitor-list">{competitors.map((company) => <article key={company.name}><div className="company-head"><span className="company-avatar" style={{ background: company.color }}>{company.initials}</span><div><strong>{company.name}</strong><span>{company.level}重点监控</span></div><a href={company.link} target="_blank" rel="noreferrer">官网 ↗</a></div><div className="account-line"><span>微信公众号</span><strong>{company.wechatName}</strong></div><h3 className="monitor-status">{company.update}</h3><p>{company.insight}</p><div className="channel-row">{company.channels.map((channel) => <span key={channel}>{channel}</span>)}</div></article>)}</div><button className="outline-button">查看全部竞对动态 <span>→</span></button></section>
            <section className="rail-card sales-card"><div className="rail-heading"><div>今日销售提示</div><span>AI</span></div><ol><li><b>01</b><div><strong>优先跟进旺季备货客户</strong><p>运价预期上行，锁价与稳定运力是有效切入点。</p></div></li><li><b>02</b><div><strong>突出合规承运商价值</strong><p>结合近期执法检查，说明低价异常运力的履约风险。</p></div></li><li><b>03</b><div><strong>关注超大件客户需求</strong><p>竞对持续强调特殊货物能力，可准备差异化案例。</p></div></li></ol></section>
            <section className="rail-card source-card"><div className="rail-heading"><div>数据与版权说明</div></div><p>受版权限制的来源仅展示中文摘要与原文链接，不转载全文或图片。</p><div><span>主要来源</span><strong>FreightWaves</strong></div><div><span>抓取窗口</span><strong>近 30 天</strong></div><div><span>历史保留</span><strong>365 天</strong></div><div><span>下次更新</span><strong>下周一 09:00</strong></div></section>
          </aside>
        </div>
      </section>
    </main>
  );
}
