/**
 * Batch 2C-2 verification — L-03 「最近」
 *   npm run test:batch2c2
 */

import assert from "node:assert/strict";
import {
  buildRecentTripCandidates,
  isTripStarted,
  isValidRecentCurrentTrip,
  NO_RECENT_RECORD_TRIP_MESSAGE,
  RECENT_TRIP_CANDIDATE_LIMIT,
  resolveRecentTrip,
  utcTodayIso,
} from "../lib/trips/recent-trip";
import { parseOwnHistoryQuery } from "../lib/workflows/historical-search/parse-query";
import { parseOrganizeQuery } from "../lib/workflows/organize/parse-query";

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

const TODAY = "2026-10-03";

const trips = [
  { id: "future", name: "Future", startDate: "2026-11-01", itemCount: 3 },
  { id: "empty", name: "Empty started", startDate: "2026-09-01", itemCount: 0 },
  { id: "a", name: "A", startDate: "2026-08-01", itemCount: 2 },
  { id: "b", name: "B", startDate: "2026-09-15", itemCount: 1 },
  { id: "c", name: "C", startDate: "2026-07-01", itemCount: 4 },
  { id: "d", name: "D", startDate: "2026-06-01", itemCount: 1 },
  { id: "e", name: "E", startDate: "2026-05-01", itemCount: 1 },
  { id: "f", name: "F", startDate: "2026-04-01", itemCount: 1 },
];

section("Not a time window — parse sets recentTrip");
{
  const h = parseOwnHistoryQuery("最近买的");
  assert.equal(h.status, "ok");
  if (h.status === "ok") {
    assert.equal(h.query.recentTrip, true);
    assert.equal(h.query.purchaseDateFrom, undefined);
    assert.equal(h.query.purchaseDateTo, undefined);
  }
  const o = parseOrganizeQuery("整理最近买的美妆");
  assert.equal(o.status, "ok");
  if (o.status === "ok") {
    assert.equal(o.spec.filter.recentTrip, true);
    assert.equal(o.spec.filter.purchaseDateFrom, undefined);
  }
}

section("Trip started uses start_date only (not end_date)");
{
  assert.equal(isTripStarted("2026-10-03", TODAY), true);
  assert.equal(isTripStarted("2026-10-04", TODAY), false);
  assert.equal(isTripStarted("2026-09-01", TODAY), true);
}

section("Current Trip valid → use directly");
{
  const r = resolveRecentTrip(
    {
      entry: "trip",
      currentTrip: { id: "b", startDate: "2026-09-15", itemCount: 1 },
    },
    trips,
    TODAY,
  );
  assert.equal(r.status, "use");
  if (r.status === "use") assert.equal(r.tripId, "b");
}

section("Global Entry → candidates, not current trip");
{
  const r = resolveRecentTrip(
    {
      entry: "global",
      currentTrip: { id: "b", startDate: "2026-09-15", itemCount: 1 },
    },
    trips,
    TODAY,
  );
  assert.equal(r.status, "choose");
}

section("Trip not started is invalid current");
{
  assert.equal(
    isValidRecentCurrentTrip(
      {
        entry: "trip",
        currentTrip: { id: "future", startDate: "2026-11-01", itemCount: 3 },
      },
      TODAY,
    ),
    false,
  );
}

section("Trip without records is invalid current");
{
  assert.equal(
    isValidRecentCurrentTrip(
      {
        entry: "trip",
        currentTrip: { id: "empty", startDate: "2026-09-01", itemCount: 0 },
      },
      TODAY,
    ),
    false,
  );
}

section("start_date DESC and max 5");
{
  const c = buildRecentTripCandidates(trips, TODAY);
  assert.equal(c.length, RECENT_TRIP_CANDIDATE_LIMIT);
  assert.deepEqual(
    c.map((x) => x.id),
    ["b", "a", "c", "d", "e"],
  );
  assert.equal(c.some((x) => x.id === "future"), false);
  assert.equal(c.some((x) => x.id === "empty"), false);
  assert.equal(c.some((x) => x.id === "f"), false);
}

section("Single candidate → use");
{
  const r = resolveRecentTrip(
    { entry: "global", currentTrip: null },
    [{ id: "only", name: "Only", startDate: "2026-01-01", itemCount: 2 }],
    TODAY,
  );
  assert.equal(r.status, "use");
  if (r.status === "use") assert.equal(r.tripId, "only");
}

section("Multiple candidates → choose");
{
  const r = resolveRecentTrip(
    { entry: "global", currentTrip: null },
    trips,
    TODAY,
  );
  assert.equal(r.status, "choose");
  if (r.status === "choose") {
    assert.ok(r.candidates.length > 1);
    assert.ok(r.candidates.length <= 5);
  }
}

section("No candidates");
{
  const r = resolveRecentTrip(
    { entry: "global", currentTrip: null },
    [
      { id: "future", name: "F", startDate: "2026-11-01", itemCount: 9 },
      { id: "empty", name: "E", startDate: "2026-01-01", itemCount: 0 },
    ],
    TODAY,
  );
  assert.equal(r.status, "none");
  if (r.status === "none") {
    assert.equal(r.message, NO_RECENT_RECORD_TRIP_MESSAGE);
  }
}

section("utcTodayIso shape");
{
  assert.match(utcTodayIso(Date.UTC(2026, 9, 3)), /^\d{4}-\d{2}-\d{2}$/);
}

console.log("\nBatch 2C-2 verification passed.\n");
