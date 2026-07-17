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
  industryView: string;
  category: string;
  impact: "利好" | "关注" | "风险";
  tags: string[];
  link: string;
};

type CompetitorChannel = {
  label: string;
  href?: string;
};

const topStories = [
  { rank: "01", category: "市场运价", title: "美国 TL、LTL 运价指数预计在第三季度刷新高位", summary: "二季度卡车运价指数明显上行，运力收紧与需求回升正在改变承运商议价能力。", signal: "销售机会", signalText: "提前锁定旺季线路与报价", tone: "blue" },
  { rank: "02", category: "合规监管", title: "美国多州扩大商用车辆与 CDL 执法检查", summary: "近期检查重点集中在驾驶资质、设备合规与承运商安全记录，异常运力面临退出风险。", signal: "风险提醒", signalText: "重新核验合作承运商资质", tone: "orange" },
  { rank: "03", category: "车队经营", title: "运输企业成本继续跑赢消费通胀", summary: "保险、设备、司机薪酬和维修费用仍在抬升，美国本土卡车运输报价承压。", signal: "客户沟通", signalText: "解释报价上涨的成本来源", tone: "violet" },
];

const newsItems: NewsItem[] = [
  { publishedDate: "2026-07-15", publishedAt: "07.15", publishedDay: "周三", source: "FreightWaves", score: 88, title: "ATRI：2025年卡车运输成本涨幅超过消费者通胀", summary: "ATRI报告显示，2025年美国卡车平均运营成本由每英里2.260美元升至2.336美元，同比增长3.4%；剔除燃油后涨幅为4.2%，高出同期通胀1.5个百分点。车辆租购、维修保养、保险、轮胎及员工福利等支出均继续增加。", industryView: "运输成本持续高于通胀，报价短期难明显回落。比较卡派价格时应同时核验保险、车况和履约能力，异常低价运力需谨慎。", category: "市场运价", impact: "关注", tags: ["运输成本", "保险", "车队"], link: "https://www.freightwaves.com/news/trucking-costs-outpaced-consumer-inflation-in-25-atri" },
  { publishedDate: "2026-07-14", publishedAt: "07.14", publishedDay: "周二", source: "FreightWaves", score: 84, title: "货运困境报告：承运商与物流设施关闭导致逾245个岗位消失", summary: "四家物流与配送企业关闭或裁员，合计影响约248个岗位，其中涉及Fusion Transport、Frito-Lay、D&H和DHL；同期另有九家运输及供应链相关企业申请破产，业务范围覆盖卡车运输、货代、仓储和挂车制造。", industryView: "行业出清会造成部分线路运力和服务波动。选择承运商不能只看报价，还应核验经营状态、保险有效性和在途保障，避免停运断链。", category: "公司动态", impact: "风险", tags: ["倒闭", "裁员", "运力"], link: "https://www.freightwaves.com/news/freight-distress-report-carrier-logistics-closures-erase-over-245-jobs" },
  { publishedDate: "2026-07-14", publishedAt: "07.14", publishedDay: "周二", source: "FreightWaves", score: 92, title: "第三季度TL、LTL运价将创新高", summary: "AFS Logistics与TD Cowen报告显示，TL和LTL运价指数在二季度双双创新高，三季度仍将继续上涨。TL每英里运价指数较2018年基准高16%，预计三季度升至17.7%；LTL每磅运价指数二季度高出基准76.5%，燃油和运力收紧是主要推力。", industryView: "运价上行已从现货市场扩散到合同及LTL报价。销售应缩短报价有效期，旺季线路尽早锁定运力，并向客户预留燃油和运力收紧带来的调价空间。", category: "市场运价", impact: "关注", tags: ["TL", "LTL", "运价"], link: "https://www.freightwaves.com/news/tl-ltl-rates-to-hit-new-highs-in-q3" },
  { publishedDate: "2026-07-14", publishedAt: "07.14", publishedDay: "周二", source: "FreightWaves", score: 77, title: "两家公司联合发布的司机薪酬指数大幅飙升", summary: "AscendTMS与Superior Trucking联合编制的司机薪酬指数，以2020年1月为100点，从2026年4月的150.83升至6月的170.04，两个月上涨13.5%，创该指数历史最大两月增幅，并显示合规司机供给持续偏紧。", industryView: "司机薪酬上涨将继续传导至真实运力成本，旺季、长途和偏远线路的报价压力更明显；遇到明显低于市场的报价，应重点核查司机与车辆合规性。", category: "司机与车队", impact: "关注", tags: ["司机", "薪酬", "旺季"], link: "https://www.freightwaves.com/news/index-of-driver-pay-product-of-two-companies-is-surging" },
  { publishedDate: "2026-07-13", publishedAt: "07.13", publishedDay: "周一", source: "FreightWaves", score: 76, title: "Knight-Swift新开4个LTL货运站点", summary: "Knight-Swift旗下LTL业务AAA Cooper新开4个货运站点。凤凰城和华盛顿州奥林匹亚站点补充现有市场运力，底特律和俄亥俄州托莱多则进入新市场。整合后的AAA Cooper约有180个站点，覆盖约70%的美国地区。", industryView: "大型LTL网络扩张会改变区域线路覆盖和中转选择。比价时可重新评估凤凰城、底特律等市场的承运商组合，但仍需同步比较时效、附加费和末端服务稳定性。", category: "公司动态", impact: "利好", tags: ["LTL", "站点", "运力"], link: "https://www.freightwaves.com/news/knight-swift-opens-4-ltl-terminals" },
  { publishedDate: "2026-07-09", publishedAt: "07.09", publishedDay: "周四", source: "FreightWaves", score: 86, title: "FMCSA当日撤销的10款ELD中，3款已有被撤销记录", summary: "FMCSA于7月9日从注册名单撤销10款不符合最低技术要求的ELD，使2025年以来被撤销设备增至90款。使用相关设备的车队须立即改用纸质日志或合规软件，并在9月8日前完成更换；逾期将面临无工时记录处罚及停运。", industryView: "ELD被撤销会直接导致车辆停运和货物延误。承运商准入及派车前应核对设备是否仍在FMCSA注册名单，并关注同一厂商换名或重复违规风险。", category: "法规合规", impact: "风险", tags: ["FMCSA", "ELD", "停运"], link: "https://www.freightwaves.com/news/3-of-todays-10-fmcsa-revoked-elds-had-already-been-pulled-once" },
  { publishedDate: "2026-07-07", publishedAt: "07.07", publishedDay: "周二", source: "FreightWaves", score: 95, title: "LTL承运商Mountain Valley Express停止运营", summary: "Mountain Valley Express于7月7日确认停止运营，现有账户和服务同日失效，不再接收新货。该区域LTL承运商在加州、亚利桑那州和内华达州设有13个站点，FMCSA记录显示拥有277辆动力设备，并曾在2024年底重组及裁员约105人。", industryView: "这类突然停运会直接造成提货中断、在途货物处理和理赔风险。涉及美西区域LTL询价时，应立即排除该承运商，并复核合作车队的经营状态和备用运力。", category: "公司动态", impact: "风险", tags: ["LTL", "停运", "美西"], link: "https://www.freightwaves.com/news/ltl-carrier-mountain-valley-express-shutting-down" },
  { publishedDate: "2026-07-07", publishedAt: "07.07", publishedDay: "周二", source: "FreightWaves", score: 90, title: "6月运输定价指数徘徊在历史高位附近", summary: "6月物流经理指数显示，运输价格指标升至92.4，距离5月创下的纪录仅差3.6点；运输运力指数降至30.8，连续第七个月收缩，利用率则升至74.7。整体LMI升至71.1，为2022年3月以来首次进入显著扩张区间。", industryView: "高价格、低运力与高利用率同时出现，说明市场议价权正转向承运商。平台报价应加强时效管理，销售需提前告知客户临时加价和拒载概率上升。", category: "市场运价", impact: "关注", tags: ["LMI", "运价", "运力"], link: "https://www.freightwaves.com/news/transportation-pricing-index-hovers-near-all-time-high-in-june" },
  { publishedDate: "2026-06-30", publishedAt: "06.30", publishedDay: "周二", source: "FreightWaves", score: 81, title: "美国执法机构扩大对商用车辆违规行为的打击", summary: "得州、亚利桑那州和加州扩大商用车辆执法，重点检查车辆设备、CDL驾驶资质、医疗证明、工时日志和疲劳驾驶。行动中已有车辆因设备故障、证件缺失或安全违规被开具罚单、扣留，部分车辆及驾驶员被责令停运。", industryView: "执法收紧会直接增加查扣、停运和延误风险。询价与派车前应把驾驶资质、USDOT、设备维护及日志记录列为必要核验项。", category: "法规合规", impact: "风险", tags: ["FMCSA", "CDL", "路检"], link: "https://www.freightwaves.com/news/us-law-agencies-expand-crackdown-on-commercial-vehicle-violators" },
  { publishedDate: "2026-06-26", publishedAt: "06.26", publishedDay: "周五", source: "FreightWaves", score: 74, title: "长滩港与卡车承运商启动通往墨西哥的零排放走廊", summary: "长滩港认可Bali Express建设约125英里的美墨绿色卡车走廊。该车队目前拥有32辆天然气卡车和6辆电动卡车，并计划继续增加20辆天然气车及20辆电动车，目标是在2040年前实现超过350辆车的全零排放车队。", industryView: "港区及跨境线路将逐步增加绿色运力要求和附加成本。报价时应区分普通与零排放车辆，并提前确认设备准入、充能条件和线路适配性。", category: "新能源", impact: "利好", tags: ["港口", "新能源", "短驳"], link: "https://www.freightwaves.com/news/port-of-long-beach-trucker-launch-zero-emission-corridor-to-mexico" },
];

const competitors = [
  { name: "省多多", level: "A级", initials: "省", color: "#f97316", wechatName: "省多多北美卡车平台", update: "小红书、抖音主页已接入；公众号与视频号入口待补充", insight: "销售可直接进入已核验的竞对主页；公开内容仍按近 30 天范围监控。", channels: [{ label: "公众号" }, { label: "官网", href: "http://sddltl.com/Default.aspx" }, { label: "小红书", href: "https://xhslink.com/m/75sNtVt2wwW" }, { label: "视频号" }, { label: "抖音", href: "https://v.douyin.com/xEe-XTIB5VA" }] satisfies CompetitorChannel[], link: "http://sddltl.com/Default.aspx" },
  { name: "货马达", level: "A级", initials: "货", color: "#2563eb", wechatName: "货马达美国卡车运输平台", update: "近 30 天暂无可公开验证的公众号更新", insight: "账号主页链接待补充，暂不绑定未经核验的同名账号。", channels: [{ label: "公众号" }, { label: "官网", href: "https://www.hmd-truck.com" }, { label: "小红书" }, { label: "视频号" }, { label: "抖音" }] satisfies CompetitorChannel[], link: "https://www.hmd-truck.com" },
];

const DATA_WINDOW_DAYS = 30;
const DATA_WINDOW_MS = DATA_WINDOW_DAYS * 24 * 60 * 60 * 1000;
const isWithinDataWindow = (publishedDate: string) => {
  const age = Date.now() - new Date(`${publishedDate}T23:59:59Z`).getTime();
  return age >= 0 && age <= DATA_WINDOW_MS;
};

const filters = ["全部", "市场运价", "法规合规", "公司动态", "司机与车队", "新能源"];
const topics = [
  { label: "运价与货量", filter: "市场运价", dot: "red" },
  { label: "FMCSA 合规", filter: "法规合规", dot: "blue" },
  { label: "倒闭与裁员", filter: "公司动态", dot: "amber" },
  { label: "新能源卡车", filter: "新能源", dot: "green" },
];

export default function Home() {
  const [activeFilter, setActiveFilter] = useState("全部");
  const [query, setQuery] = useState("");
  const [bookmarked, setBookmarked] = useState<string[]>([]);
  const visibleNews = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return newsItems.filter((item) => isWithinDataWindow(item.publishedDate) && (activeFilter === "全部" || item.category === activeFilter) && (!keyword || `${item.title}${item.summary}${item.industryView}${item.tags.join("")}`.toLowerCase().includes(keyword)));
  }, [activeFilter, query]);
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
            const count = newsItems.filter((item) => isWithinDataWindow(item.publishedDate) && item.category === topic.filter).length;
            return <button className={activeFilter === topic.filter ? "active" : ""} data-filter={topic.filter} onClick={() => selectTopic(topic.filter)} aria-pressed={activeFilter === topic.filter} title={`筛选${topic.label}专题`} key={topic.label}><i className={`dot ${topic.dot}`} /><span>{topic.label}</span><b>{count}</b></button>;
          })}
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
              <div className="brief-metrics"><div><span>近 30 天精选</span><strong>{visibleNews.length}</strong><small>条可追溯资讯</small></div><div><span>市场温度</span><strong className="warm">偏热</strong><small>综合近月信号</small></div><div><span>风险事件</span><strong className="risk">{String(visibleNews.filter((item) => item.impact === "风险").length).padStart(2, "0")}</strong><small>需销售关注</small></div><div><span>竞对公众号</span><strong>00</strong><small>近 30 天可验证</small></div></div>
            </section>

            <section className="section-block" id="brief">
              <div className="section-heading"><div><span className="section-index">01</span><h2>今日热点 TOP 3</h2></div><span className="section-note">近 30 天数据 · 基于时效、行业影响与销售价值排序</span></div>
              <div className="top-story-grid">{topStories.map((story) => <article className={`top-story ${story.tone}`} key={story.rank}><div className="story-meta"><span>{story.rank}</span><b>{story.category}</b></div><h3>{story.title}</h3><p>{story.summary}</p><div className="story-signal"><span>{story.signal}</span><strong>{story.signalText}</strong></div></article>)}</div>
            </section>

            <section className="section-block" id="news">
              <div className="section-heading news-heading"><div><span className="section-index">02</span><h2>最新精选</h2><span className="range-chip">仅近 30 天</span></div><a href="https://www.freightwaves.com/news/category/news/trucking" target="_blank" rel="noreferrer">查看 FreightWaves 原站 ↗</a></div>
              <div className="filter-row" id="topics">{filters.map((filter) => <button className={filter === activeFilter ? "active" : ""} onClick={() => setActiveFilter(filter)} key={filter}>{filter}</button>)}</div>
              <div className="news-list">
                {visibleNews.map((item) => <article className="news-row" data-category={item.category} key={item.title}><div className="news-time"><em>原文发布</em><strong>{item.publishedAt}</strong><small>{item.publishedDay}</small><span>{item.source}</span></div><div className="score" aria-label={`重要性评分 ${item.score}`}><strong>{item.score}</strong><span>重要性</span></div><div className="news-body"><div className="news-title-line"><span className={`impact ${item.impact}`}>{item.impact}</span><h3>{item.title}</h3></div><div className="news-copy"><p className="news-summary"><strong>原文摘要</strong><span>{item.summary}</span></p><p className="industry-view"><strong>行业看法</strong><span>{item.industryView}</span></p></div><div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></div><div className="news-actions"><button className={bookmarked.includes(item.title) ? "saved" : ""} onClick={() => toggleBookmark(item.title)} aria-label="收藏资讯">{bookmarked.includes(item.title) ? "★" : "☆"}</button><a href={item.link} target="_blank" rel="noreferrer">原文 ↗</a></div></article>)}
                {visibleNews.length === 0 && <div className="empty-state">没有找到匹配的资讯，请更换关键词或分类。</div>}
              </div>
            </section>
          </div>

          <aside className="right-rail" id="competitors">
            <section className="rail-card competitor-card"><div className="rail-heading"><div><span className="live-dot" />竞对动态监控</div><button aria-label="更多竞对">•••</button></div><p className="rail-subtitle">2 家 A 级竞对 · 监控范围近 30 天</p><div className="competitor-list">{competitors.map((company) => <article key={company.name}><div className="company-head"><span className="company-avatar" style={{ background: company.color }}>{company.initials}</span><div><strong>{company.name}</strong><span>{company.level}重点监控</span></div><a href={company.link} target="_blank" rel="noreferrer">官网 ↗</a></div><div className="account-line"><span>微信公众号</span><strong>{company.wechatName}</strong></div><h3 className="monitor-status">{company.update}</h3><p>{company.insight}</p><div className="channel-row">{company.channels.map((channel) => channel.href ? <a href={channel.href} target="_blank" rel="noreferrer" title={`打开${company.name}${channel.label}主页`} key={channel.label}>{channel.label} ↗</a> : <span className="unavailable" title="入口待补充" key={channel.label}>{channel.label} · 待补</span>)}</div></article>)}</div><button className="outline-button">查看全部竞对动态 <span>→</span></button></section>
            <section className="rail-card sales-card"><div className="rail-heading"><div>今日销售提示</div><span>AI</span></div><ol><li><b>01</b><div><strong>优先跟进旺季备货客户</strong><p>运价预期上行，锁价与稳定运力是有效切入点。</p></div></li><li><b>02</b><div><strong>突出合规承运商价值</strong><p>结合近期执法检查，说明低价异常运力的履约风险。</p></div></li><li><b>03</b><div><strong>关注超大件客户需求</strong><p>竞对持续强调特殊货物能力，可准备差异化案例。</p></div></li></ol></section>
            <section className="rail-card source-card"><div className="rail-heading"><div>数据与版权说明</div></div><p>受版权限制的来源仅展示中文摘要与原文链接，不转载全文或图片。</p><div><span>主要来源</span><strong>FreightWaves</strong></div><div><span>抓取窗口</span><strong>近 30 天</strong></div><div><span>历史保留</span><strong>365 天</strong></div><div><span>下次更新</span><strong>下周一 09:00</strong></div></section>
          </aside>
        </div>
      </section>
    </main>
  );
}
