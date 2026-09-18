import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const data = JSON.parse(await readFile(new URL("../public/data/carriers.json", import.meta.url), "utf8"));
assert.equal(data.schemaVersion, 1);
assert.equal(data.carriers.length, 50);
assert.equal(data.edition.rankedCount, 50);
assert.ok(data.source.officialDatasetUrl.includes("az4n-8mr2"));

for (const [index, carrier] of data.carriers.entries()) {
  assert.equal(carrier.rank, index + 1);
  assert.ok(carrier.legalName);
  assert.match(String(carrier.dotNumber), /^\d+$/);
  assert.ok(carrier.powerUnits >= 1000 && carrier.powerUnits <= 200000);
  assert.ok(carrier.totalDrivers >= 200);
  assert.ok(carrier.mcs150Date >= "2024-01-01");
  assert.ok(!(carrier.registeredDate >= "2024-01-01" && carrier.powerUnits >= 10000));
  assert.ok(carrier.saferUrl.includes(`query_string=${carrier.dotNumber}`));
  if (index > 0) assert.ok(data.carriers[index - 1].powerUnits >= carrier.powerUnits);
}

process.stdout.write("Carrier ranking validation passed: 50 ordered records.\n");
