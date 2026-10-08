/**
 * Batch 2C-1 verification — L-01 Destination (Brand remains BLOCKED).
 *   npm run test:batch2c1
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  isTripDestinationFilled,
  normalizeTripDestination,
} from "../lib/trips/validation";
import {
  extractDestination,
  detectRelativeDestinationTripMode,
} from "../lib/trips/destination-parse";
import { parseOwnHistoryQuery } from "../lib/workflows/historical-search/parse-query";
import { parseOrganizeQuery } from "../lib/workflows/organize/parse-query";
import { toHistoryIlikePattern } from "../lib/history/sanitize";

const ROOT = path.resolve(__dirname, "..");

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

section("Migration adds nullable destination (no NOT NULL / backfill)");
{
  const mig = path.join(
    ROOT,
    "supabase",
    "migrations",
    "20261003120000_phase3_trip_destination.sql",
  );
  assert.ok(fs.existsSync(mig), "missing destination migration");
  const sql = fs.readFileSync(mig, "utf8");
  assert.match(sql, /add column destination text/i);
  assert.equal(
    /add column destination text\s+not null/i.test(sql),
    false,
  );
  assert.equal(/\bupdate\s+public\.trips\b/i.test(sql), false);
}

section("TripForm Destination field + create required validation helpers");
{
  const form = fs.readFileSync(
    path.join(ROOT, "components", "travel", "TripForm.tsx"),
    "utf8",
  );
  assert.match(form, /目的地/);
  assert.match(form, /isTripDestinationFilled/);
  assert.match(form, /normalizeTripDestination/);
  assert.match(form, /mode === "create"/);
  assert.equal(isTripDestinationFilled(""), false);
  assert.equal(isTripDestinationFilled("  东京  "), true);
  assert.equal(normalizeTripDestination("  东京  "), "东京");
  assert.equal(normalizeTripDestination("   "), null);
}

section("Trip Detail shows Destination / 未填写");
{
  const cover = fs.readFileSync(
    path.join(ROOT, "components", "travel", "TripCover.tsx"),
    "utf8",
  );
  assert.match(cover, /未填写/);
  assert.match(cover, /destination/);
}

section("DAL / types include destination");
{
  for (const rel of [
    "lib/trips/types.ts",
    "lib/trips/mutations.ts",
    "lib/trips/detail.ts",
    "lib/trips/queries.ts",
    "lib/history/queries.ts",
    "lib/history/types.ts",
  ]) {
    const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
    assert.match(text, /destination/, `${rel} should mention destination`);
  }
  const historyQ = fs.readFileSync(
    path.join(ROOT, "lib", "history", "queries.ts"),
    "utf8",
  );
  assert.match(historyQ, /trips\.destination/);
  assert.equal(toHistoryIlikePattern("日本"), "%日本%");
}

section("F3-02 Destination parse");
{
  const plain = parseOwnHistoryQuery("日本买过什么");
  assert.equal(plain.status, "ok");
  if (plain.status === "ok") {
    assert.equal(plain.query.destination, "日本");
  }

  const relative = parseOwnHistoryQuery("上次去日本买的");
  assert.equal(relative.status, "ok");
  if (relative.status === "ok") {
    assert.equal(relative.query.destination, "日本");
    assert.equal(relative.query.relativeDestinationTrip, "latest");
  }

  const first = parseOwnHistoryQuery("第一次去泰国买了什么");
  assert.equal(first.status, "ok");
  if (first.status === "ok") {
    assert.equal(first.query.destination, "泰国");
    assert.equal(first.query.relativeDestinationTrip, "first");
  }
}

section("F3-03 Destination parse");
{
  const r = parseOrganizeQuery("帮我整理日本的购物");
  assert.equal(r.status, "ok");
  if (r.status === "ok") {
    assert.equal(r.spec.filter.destination, "日本");
  }
}

section("Brand remains BLOCKED");
{
  const r = parseOrganizeQuery("整理资生堂牌子的购物");
  assert.equal(r.status, "blocked");
  if (r.status === "blocked") assert.equal(r.code, "L-01");
}

section("L-03 最近 parse (Batch 2C-2)");
{
  const h = parseOwnHistoryQuery("最近买的");
  assert.equal(h.status, "ok");
  if (h.status === "ok") assert.equal(h.query.recentTrip, true);
  const o = parseOrganizeQuery("整理最近买的美妆");
  assert.equal(o.status, "ok");
  if (o.status === "ok") assert.equal(o.spec.filter.recentTrip, true);
}

section("Destination extract helpers");
{
  assert.equal(extractDestination("目的地：北海道"), "北海道");
  assert.equal(detectRelativeDestinationTripMode("上次去日本"), "latest");
  assert.equal(detectRelativeDestinationTripMode("第一次去日本"), "first");
  assert.equal(detectRelativeDestinationTripMode("日本买过什么"), null);
}

section("No Brand field invented");
{
  const types = fs.readFileSync(path.join(ROOT, "lib", "trips", "types.ts"), "utf8");
  assert.equal(/\bbrand\b/i.test(types), false);
  const migGlob = fs
    .readdirSync(path.join(ROOT, "supabase", "migrations"))
    .filter((f) => f.endsWith(".sql"));
  for (const f of migGlob) {
    const sql = fs.readFileSync(
      path.join(ROOT, "supabase", "migrations", f),
      "utf8",
    );
    assert.equal(
      /\bbrand\b/i.test(sql),
      false,
      `${f} must not add brand`,
    );
  }
}

console.log("\nBatch 2C-1 verification passed.\n");
