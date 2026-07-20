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
  { rank: "01", category: "市场运价", title: "卡车运价高位运行，但短期现货价格出现回调", summary: "运力仍偏紧、需求同比增长，但7月中旬干货、冷藏和平台现货价格均出现季节性回落，市场进入高位震荡。", signal: "销售机会", signalText: "区分长期涨价趋势与短期周度回调", tone: "blue" },
  { rank: "02", category: "成本压力", title: "美国卡车平均运营成本升至每英里2.336美元", summary: "维修、路桥费、轮胎和福利成本全面上升，整车与冷藏承运商利润率仍低于1%，低价运力风险加大。", signal: "报价提醒", signalText: "校验低价背后的保险、车况与履约能力", tone: "orange" },
  { rank: "03", category: "头部信号", title: "J.B. Hunt判断更大幅度的运价调整正在临近", summary: "头部承运商认为可用运力持续收紧，客户投标更频繁，合同运价与多式联运价格存在继续上调空间。", signal: "客户沟通", signalText: "缩短报价有效期并提前锁定旺季运力", tone: "violet" },
];

const newsItems: NewsItem[] = [
  { publishedDate: "2026-07-17", publishedAt: "07.17", publishedDay: "周五", source: "FleetOwner", score: 94, title: "J.B. Hunt高管：更大幅度的运价调整即将到来", summary: "J.B. Hunt表示，二季度经纪业务费率已明显上行，整车运价正在跟进，多式联运随后也可能调价。公司二季度净利润达1.81亿美元，客户因基础运力收紧而更频繁重设运输网络、增加投标，并转向大型可靠承运商。", industryView: "头部承运商对合同运价的判断比单周现货波动更具前瞻性。卡派平台应缩短报价有效期，优先锁定旺季和紧张线路运力，并用可用运力收缩解释客户价格变化。", category: "市场运价", impact: "关注", tags: ["J.B. Hunt", "合同运价", "运力"], link: "https://www.fleetowner.com/news/news/55391547/jb-hunt-q2-profits-rise-as-truckload-capacity-tightens" },
  { publishedDate: "2026-07-16", publishedAt: "07.16", publishedDay: "周四", source: "FleetOwner", score: 93, title: "卡车运营成本创历史新高，ATRI分析显示盈利仍承压", summary: "ATRI最新报告显示，2025年美国卡车平均运营成本升至每英里2.336美元，同比增长3.4%；剔除燃油后升至1.854美元。维修、路桥费、轮胎和司机福利均上涨，整车及冷藏承运商平均利润率仍低于1%。", industryView: "运价回升并不等于承运商利润同步修复，车辆维护和人员成本仍会传导到报价。面对异常低价，应同时核查保险、设备状况、空驶比例和履约记录，避免低价高风险。", category: "市场运价", impact: "风险", tags: ["ATRI", "运营成本", "承运商利润"], link: "https://www.fleetowner.com/news/news/55391195/atri-releases-2026-trucking-operational-cost-report-for-fleet-benchmarking" },
  { publishedDate: "2026-07-16", publishedAt: "07.16", publishedDay: "周四", source: "FleetOwner", score: 89, title: "货量增长之际，平板现货运价出现第二大单周跌幅", summary: "FTR数据显示，全市场经纪现货报价单周下降14美分，为2021年以来最大跌幅；干货、冷藏和平板费率均回落，但对应货量分别增长19%、逾10%和近31%。DAT口径下干货每英里2.50美元、冷藏2.83美元、平板3.00美元。", industryView: "本轮下跌更像旺季后的短期回调，而非运力宽松，三类车型价格同比仍高约42%至49%。销售报价应看具体线路和车型，不宜用全国周度下跌直接承诺客户全面降价。", category: "市场运价", impact: "关注", tags: ["现货运价", "FTR", "DAT"], link: "https://www.fleetowner.com/news/rates/news/55391186/truckload-spot-rates-fall-as-flatbed-rates-post-second-largest-weekly-decline" },
  { publishedDate: "2026-07-16", publishedAt: "07.16", publishedDay: "周四", source: "TLI", score: 91, title: "卡车运价为何持续攀升：需求复苏叠加监管驱动的运力短缺", summary: "TLI汇总LMI、DAT和美国运输价格数据称，货源发布量同比增长62.2%，卡车发布量下降12%，干货、冷藏和平板运价分别上涨29.4%、21%和35.8%；监管收紧与柴油成本共同压缩合规运力。", industryView: "需求增长与运力退出同时发生，意味着价格压力不会仅靠油价回落迅速消失。平台应按线路持续校准实时运力，并把司机资质、监管政策和燃油附加费纳入报价有效期管理。", category: "市场运价", impact: "关注", tags: ["运力短缺", "LMI", "监管"], link: "https://shiptli.com/news/why-truck-freight-rates-are-rising-july-2026/" },
  { publishedDate: "2026-07-15", publishedAt: "07.15", publishedDay: "周三", source: "FreightWaves", score: 94, title: "J.B. Hunt二季度业绩超预期，股价上涨9%", summary: "J.B. Hunt二季度营收35亿美元，同比增长19%，每股收益1.91美元，均超过市场预期。多式联运装载量增长10%，经纪业务十四个季度来首次实现营业利润，但外购运力成本同比上升54%，资产轻型整车业务仍录得亏损。", industryView: "大型承运商量价齐升并恢复经纪业务盈利，说明货量与运价环境正在改善；但采购运输成本快速上涨，卡派报价有效期和承运商成本校验仍需收紧。", category: "市场运价", impact: "利好", tags: ["J.B. Hunt", "多式联运", "经纪业务"], link: "https://www.freightwaves.com/news/j-b-hunts-shares-up-9-on-q2-earnings-beat" },
  { publishedDate: "2026-07-15", publishedAt: "07.15", publishedDay: "周三", source: "FreightWaves", score: 93, title: "OOIDA敦促众议院在宾州致命事故后表决《达莉拉法案》", summary: "OOIDA敦促美国众议院表决H.R.5688，将FMCSA对非本地CDL的限制永久写入法律，并加强驾驶员身份、资格及最长十年驾驶记录核验。该法案已于3月以35比26通过众议院运输与基础设施委员会。", industryView: "若法案推进，非本地CDL和驾驶员筛查将更严格，合规司机供给可能继续收缩。平台应提前核验承运商司机档案，并为旺季运力和报价预留波动空间。", category: "法规合规", impact: "风险", tags: ["OOIDA", "CDL", "达莉拉法案"], link: "https://www.freightwaves.com/news/ooida-urges-house-to-vote-on-dalilahs-law-after-deadly-pennsylvania-crash" },
  { publishedDate: "2026-07-15", publishedAt: "07.15", publishedDay: "周三", source: "FreightWaves", score: 84, title: "特斯拉与Paper Transport在芝加哥合作评估电动半挂卡车", summary: "威斯康星州承运商Paper Transport将在芝加哥市场的固定专用运输线路评估Tesla Semi Long Range，以稳定里程和可预测路线检验续航、可靠性与成本表现。特斯拉计划在2026年逐步扩大Semi量产及重卡充电设施部署。", industryView: "固定线路最适合率先验证电动重卡的总成本。短期不会改变主流卡派运价，但涉及ESG客户、专用线路和芝加哥周边运输时，可持续运力会成为差异化选项。", category: "新能源", impact: "利好", tags: ["Tesla Semi", "芝加哥", "专用运输"], link: "https://www.freightwaves.com/news/tesla-paper-transport-partner-on-electric-semi-evaluation-in-chicago" },
  { publishedDate: "2026-07-15", publishedAt: "07.15", publishedDay: "周三", source: "FreightWaves", score: 80, title: "Waabi与沃尔沃验证自动驾驶卡车的跨车型泛化能力", summary: "Waabi将仅在Peterbilt 579上训练的自动驾驶软件直接接入Volvo VNL Autonomous，无需新增真实道路数据、仿真训练或工程调整，首次行驶即可完成高速公路、红绿灯、转弯及复杂路口驾驶任务。", industryView: "跨车型部署时间若从一年以上缩短到即插即用，自动驾驶运力扩张成本会明显下降。对卡派平台而言，近期重点仍是关注其商业化线路、接管责任和保险定价。", category: "司机与车队", impact: "关注", tags: ["自动驾驶", "Waabi", "Volvo VNL"], link: "https://www.freightwaves.com/news/autonomous-truck-generalization" },
  { publishedDate: "2026-07-15", publishedAt: "07.15", publishedDay: "周三", source: "FreightWaves", score: 74, title: "Navistar在卡车延迟交付的1650万美元诉讼中胜诉", summary: "密歇根州联邦陪审团驳回GLS LeasCo与Central Transport针对Navistar提出的违约和欺诈索赔。争议涉及2022年订购的1100辆International牵引车，原告称延迟交付造成二手车残值下降及额外维修成本。", industryView: "案件说明生产计划不等同于保证交付日期，车队更新和运力采购合同应明确交付承诺、延期责任与替代车辆安排，避免设备延迟进一步传导到线路履约。", category: "公司动态", impact: "关注", tags: ["Navistar", "车辆交付", "合同风险"], link: "https://www.freightwaves.com/news/navistar-defeats-16-5m-lawsuit-over-delayed-truck-deliveries" },
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
          <div><div className="eyebrow">MONDAY · 2026.07.20</div><h1>美国卡车运输情报</h1></div>
          <label className="search-box"><span>⌕</span><input aria-label="搜索资讯" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索公司、政策、线路或关键词" /><kbd>⌘ K</kbd></label>
          <div className="topbar-actions"><button className="icon-button" aria-label="邮件通知">✉</button><div className="update-pill"><i />已更新 <strong>10:01</strong></div></div>
        </header>

        <div className="workspace">
          <div className="main-column">
            <section className="morning-brief" id="today">
              <div className="brief-copy"><div className="brief-kicker">KAKA MORNING BRIEF · 第 003 期</div><h2>运价仍处高位震荡，<br />承运成本与合规运力继续承压。</h2><p>7月16日至17日的行业更新显示，现货价格在货量增长中出现季节性回调，但同比仍明显上涨；头部承运商则判断合同运价仍有上调空间。销售应按线路和车型报价，避免把单周回落解读为全面降价。</p><div className="brief-actions"><a href="#news" className="primary-button">阅读完整晨报 <span>→</span></a><span>预计阅读 10 分钟</span></div></div>
              <div className="brief-metrics"><div><span>近 30 天精选</span><strong>{visibleNews.length}</strong><small>条可追溯资讯</small></div><div><span>市场温度</span><strong className="warm">偏热</strong><small>综合近月信号</small></div><div><span>风险事件</span><strong className="risk">{String(visibleNews.filter((item) => item.impact === "风险").length).padStart(2, "0")}</strong><small>需销售关注</small></div><div><span>竞对公众号</span><strong>00</strong><small>近 30 天可验证</small></div></div>
            </section>

            <section className="section-block" id="brief">
              <div className="section-heading"><div><span className="section-index">01</span><h2>今日热点 TOP 3</h2></div><span className="section-note">近 30 天数据 · 基于时效、行业影响与销售价值排序</span></div>
              <div className="top-story-grid">{topStories.map((story) => <article className={`top-story ${story.tone}`} key={story.rank}><div className="story-meta"><span>{story.rank}</span><b>{story.category}</b></div><h3>{story.title}</h3><p>{story.summary}</p><div className="story-signal"><span>{story.signal}</span><strong>{story.signalText}</strong></div></article>)}</div>
            </section>

            <section className="section-block" id="news">
              <div className="section-heading news-heading"><div><span className="section-index">02</span><h2>最新精选</h2><span className="range-chip">仅近 30 天</span></div><a href="https://www.freightwaves.com/news/category/news/trucking" target="_blank" rel="noreferrer">查看 FreightWaves 主来源 ↗</a></div>
              <div className="filter-row" id="topics">{filters.map((filter) => <button className={filter === activeFilter ? "active" : ""} onClick={() => setActiveFilter(filter)} key={filter}>{filter}</button>)}</div>
              <div className="news-list">
                {visibleNews.map((item) => <article className="news-row" data-category={item.category} key={item.title}><div className="news-time"><em>原文发布</em><strong>{item.publishedAt}</strong><small>{item.publishedDay}</small><span>{item.source}</span></div><div className="score" aria-label={`重要性评分 ${item.score}`}><strong>{item.score}</strong><span>重要性</span></div><div className="news-body"><div className="news-title-line"><span className={`impact ${item.impact}`}>{item.impact}</span><h3>{item.title}</h3></div><div className="news-copy"><p className="news-summary"><strong>原文摘要</strong><span>{item.summary}</span></p><p className="industry-view"><strong>行业看法</strong><span>{item.industryView}</span></p></div><div className="tag-row">{item.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div></div><div className="news-actions"><button className={bookmarked.includes(item.title) ? "saved" : ""} onClick={() => toggleBookmark(item.title)} aria-label="收藏资讯">{bookmarked.includes(item.title) ? "★" : "☆"}</button><a href={item.link} target="_blank" rel="noreferrer">原文 ↗</a></div></article>)}
                {visibleNews.length === 0 && <div className="empty-state">没有找到匹配的资讯，请更换关键词或分类。</div>}
              </div>
            </section>
          </div>

          <aside className="right-rail" id="competitors">
            <section className="rail-card competitor-card"><div className="rail-heading"><div><span className="live-dot" />竞对动态监控</div><button aria-label="更多竞对">•••</button></div><p className="rail-subtitle">2 家 A 级竞对 · 监控范围近 30 天</p><div className="competitor-list">{competitors.map((company) => <article key={company.name}><div className="company-head"><span className="company-avatar" style={{ background: company.color }}>{company.initials}</span><div><strong>{company.name}</strong><span>{company.level}重点监控</span></div><a href={company.link} target="_blank" rel="noreferrer">官网 ↗</a></div><div className="account-line"><span>微信公众号</span><strong>{company.wechatName}</strong></div><h3 className="monitor-status">{company.update}</h3><p>{company.insight}</p><div className="channel-row">{company.channels.map((channel) => channel.href ? <a href={channel.href} target="_blank" rel="noreferrer" title={`打开${company.name}${channel.label}主页`} key={channel.label}>{channel.label} ↗</a> : <span className="unavailable" title="入口待补充" key={channel.label}>{channel.label} · 待补</span>)}</div></article>)}</div><button className="outline-button">查看全部竞对动态 <span>→</span></button></section>
            <section className="rail-card sales-card"><div className="rail-heading"><div>今日销售提示</div><span>AI</span></div><ol><li><b>01</b><div><strong>不要把单周回调解释为全面降价</strong><p>现货价格虽短期回落，但三类车型同比仍高约42%至49%。</p></div></li><li><b>02</b><div><strong>缩短旺季线路报价有效期</strong><p>J.B. Hunt判断合同运价仍有上调空间，应尽早锁定可靠运力。</p></div></li><li><b>03</b><div><strong>重点核查异常低价运力</strong><p>平均运营成本创纪录，需同步确认保险、车况与履约记录。</p></div></li></ol></section>
            <section className="rail-card source-card"><div className="rail-heading"><div>数据与版权说明</div></div><p>受版权限制的来源仅展示中文摘要与原文链接，不转载全文或图片。</p><div><span>主要来源</span><strong>FreightWaves、FleetOwner、TLI</strong></div><div><span>抓取窗口</span><strong>近 30 天</strong></div><div><span>历史保留</span><strong>365 天</strong></div><div><span>下次更新</span><strong>周二 09:00</strong></div></section>
          </aside>
        </div>
      </section>
    </main>
  );
}
