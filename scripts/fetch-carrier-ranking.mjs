import { writeFile } from "node:fs/promises";

const endpoint = "https://datascoop.io/v1/datasets/us-motor-carriers/query";
const pageSize = 25;
const verifiedAt = new Date().toISOString();
const snapshotDate = verifiedAt.slice(0, 10);

const query = new URLSearchParams({
  operation: "Interstate",
  classification: "Authorized For Hire",
  status: "Active",
  minPowerUnits: "1000",
  maxPowerUnits: "200000",
  minDrivers: "200",
  limit: String(pageSize),
});

const requestPage = async (offset) => {
  const url = `${endpoint}?${query}&offset=${offset}`;
  const response = await fetch(url, { headers: { accept: "application/json" } });
  if (!response.ok) throw new Error(`Carrier source request failed: ${response.status} ${url}`);
  return response.json();
};

const firstPage = await requestPage(0);
const rows = [...firstPage.rows];
for (let offset = pageSize; offset < firstPage.total; offset += pageSize) {
  const page = await requestPage(offset);
  rows.push(...page.rows);
}

const cutoffDate = "2024-01-01";
const cleaned = rows
  .filter((row) => row.status === "Active")
  .filter((row) => row.operation === "Interstate")
  .filter((row) => row.classification?.toLowerCase().includes("authorized for hire"))
  .filter((row) => Number(row.truckUnits) > 0)
  .filter((row) => !/^passengers?$/i.test(row.cargo?.trim() ?? ""))
  .filter((row) => !/^drive away\/tow away(?:; other: driveaway)?$/i.test(row.cargo?.trim() ?? ""))
  .filter((row) => row.mcs150Date && row.mcs150Date >= cutoffDate)
  .filter((row) => !(row.registeredDate >= "2024-01-01" && Number(row.powerUnits) >= 10000))
  .filter((row) => Number(row.powerUnits) >= 1000 && Number(row.powerUnits) <= 200000)
  .filter((row) => Number(row.totalDrivers) >= 200)
  .sort((a, b) => Number(b.powerUnits) - Number(a.powerUnits) || Number(a.dotNumber) - Number(b.dotNumber));

const carrierRows = cleaned.slice(0, 50).map((row, index) => {
  const cargoTypes = (row.cargo ?? "")
    .split(";")
    .map((value) => value.trim())
    .filter(Boolean)
    .slice(0, 4);
  return {
    rank: index + 1,
    legalName: row.legalName,
    dbaName: row.dbaName || "",
    dotNumber: row.dotNumber,
    mcNumber: row.mcNumber || "",
    city: row.city,
    state: row.state,
    powerUnits: Number(row.powerUnits),
    truckUnits: Number(row.truckUnits),
    totalDrivers: Number(row.totalDrivers),
    cdlDrivers: Number(row.cdlDrivers) || null,
    mcs150Date: row.mcs150Date,
    registeredDate: row.registeredDate,
    operation: row.operation,
    classification: row.classification,
    safetyRating: row.safetyRating || "未显示",
    hazmat: row.hazmat === "true",
    cargoTypes,
    profile: `FMCSA 备案显示其为活跃州际承运商，登记 ${Number(row.powerUnits).toLocaleString("en-US")} 台动力单元、${Number(row.totalDrivers).toLocaleString("en-US")} 名司机；主要申报货类包括${cargoTypes.join("、") || "未列明"}。`,
    saferUrl: `https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${row.dotNumber}`,
  };
});

if (carrierRows.length !== 50) throw new Error(`Expected 50 ranked carriers, found ${carrierRows.length}`);

const payload = {
  schemaVersion: 1,
  edition: {
    title: "全美载货卡司规模 TOP50",
    snapshotDate,
    verifiedAt,
    sourceUpdatedAt: "2026-09-17",
    candidateCount: firstPage.total,
    rankedCount: carrierRows.length,
    rankMetric: "FMCSA MCS-150 POWER_UNITS（动力单元）",
    scope: "FMCSA 状态为 Active、经营范围为 Interstate、分类含 Authorized For Hire 的载货承运商",
  },
  methodology: [
    "以 FMCSA Company Census 公开记录为底表，按 POWER_UNITS 数值从高到低排序。",
    "限定 Active、Interstate、Authorized For Hire，并要求至少 1,000 台动力单元和 200 名司机。",
    "剔除纯客运、纯代驾移车、无卡车记录、MCS-150 早于 2024-01-01，以及新注册却申报超大规模等异常记录。",
    "排名用于市场研究，不等同于营收、服务质量、安全表现或平台合作推荐。",
  ],
  source: {
    publisher: "Federal Motor Carrier Safety Administration (FMCSA)",
    dataset: "Company Census File",
    officialDatasetUrl: "https://data.transportation.gov/Trucking-and-Motorcoaches/Company-Census-File/az4n-8mr2/about_data",
    officialProgramUrl: "https://www.fmcsa.dot.gov/registration/fmcsa-data-dissemination-program",
    saferUrl: "https://safer.fmcsa.dot.gov/CompanySnapshot.aspx",
    retrievalNote: "本版通过公开数据镜像分页读取 FMCSA 数据，并以 SAFER 官方查询链接供逐家公司复核。",
  },
  carriers: carrierRows,
};

await writeFile(new URL("../public/data/carriers.json", import.meta.url), `${JSON.stringify(payload, null, 2)}\n`, "utf8");
process.stdout.write(`Carrier ranking generated: ${carrierRows.length} of ${firstPage.total} candidates.\n`);
