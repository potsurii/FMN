/**
 * Batch 2C-3 verification — L-02 Duplicate Detection
 *   npm run test:batch2c3
 */

import assert from "node:assert/strict";
import { findSuspectedDuplicates, isExactDuplicateKey } from "../lib/todos/duplicate";
import type { DuplicateKey } from "../lib/todos/duplicate";

type Row = DuplicateKey & {
  quantity?: number;
  note?: string;
  category?: string;
  imagePath?: string;
  targetPurchaseDate?: string;
};

function section(name: string) {
  console.log(`\n✔ ${name}`);
}

const tripA = "trip-a";
const tripB = "trip-b";

const base: Row = {
  tripId: tripA,
  name: "Anessa",
  referencePrice: 3000,
  referenceCurrency: "JPY",
  referenceLocation: "松本清",
};

section("Same Trip duplicate");
{
  const existing: Row[] = [{ ...base, quantity: 1, note: "old" }];
  const matches = findSuspectedDuplicates(existing, base);
  assert.equal(matches.length, 1);
}

section("Cross Trip excluded");
{
  const matches = findSuspectedDuplicates(
    [{ ...base, tripId: tripB }],
    base,
  );
  assert.equal(matches.length, 0);
  assert.equal(
    isExactDuplicateKey({ ...base, tripId: tripB }, base),
    false,
  );
}

section("Product exact");
{
  assert.equal(
    isExactDuplicateKey(base, { ...base, name: "anessa" }),
    false,
  );
  assert.equal(
    isExactDuplicateKey(base, { ...base, name: "Anessa " }),
    false,
  );
}

section("Price + Currency exact");
{
  assert.equal(
    isExactDuplicateKey(base, { ...base, referencePrice: 3001 }),
    false,
  );
  assert.equal(
    isExactDuplicateKey(base, { ...base, referenceCurrency: "jpy" }),
    false,
  );
  assert.equal(
    isExactDuplicateKey(base, { ...base, referencePrice: 3000 }),
    true,
  );
}

section("Location exact");
{
  assert.equal(
    isExactDuplicateKey(base, { ...base, referenceLocation: "松本清 " }),
    false,
  );
}

section("AND condition — any field different → not duplicate");
{
  assert.equal(
    findSuspectedDuplicates([{ ...base, name: "Other" }], base).length,
    0,
  );
  assert.equal(
    findSuspectedDuplicates([{ ...base, referenceLocation: "Donki" }], base)
      .length,
    0,
  );
}

section("Excluded fields do not affect match");
{
  const existing = {
    ...base,
    quantity: 1,
    note: "note-a",
    category: "beauty" as const,
    imagePath: "a.jpg",
    targetPurchaseDate: "2026-01-01",
  };
  const candidateDifferentExcluded: Row = {
    ...base,
    quantity: 99,
    note: "note-b",
    category: "food",
    imagePath: "b.jpg",
    targetPurchaseDate: "2026-12-31",
  };
  assert.equal(
    findSuspectedDuplicates([existing], candidateDifferentExcluded).length,
    1,
  );
}

section("No auto-merge in detection (pure match only)");
{
  const existing: Row[] = [{ ...base, quantity: 2 }];
  const matches = findSuspectedDuplicates(existing, base);
  assert.equal(matches[0]?.quantity, 2);
}

console.log("\nBatch 2C-3 verification passed.\n");
