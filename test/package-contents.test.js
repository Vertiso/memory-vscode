// Copyright © 2026. Copyright Vertiso Corporation, all rights reserved.

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  EXPECTED_ENTRIES,
  verifyContents,
} = require("./package-contents");

test("package allowlist includes legal and Marketplace documentation", () => {
  assert.equal(EXPECTED_ENTRIES.includes("extension/readme.md"), true);
  assert.equal(EXPECTED_ENTRIES.includes("extension/LICENSE.txt"), true);
  assert.equal(EXPECTED_ENTRIES.includes("extension/changelog.md"), true);
});

test("package verifier accepts the exact allowlist", () => {
  assert.doesNotThrow(() => verifyContents(EXPECTED_ENTRIES));
});

test("package verifier rejects a missing entry", () => {
  assert.throws(
    () => verifyContents(EXPECTED_ENTRIES.slice(1)),
    /exact Marketplace artifact allowlist/,
  );
});

test("package verifier rejects an unexpected entry", () => {
  assert.throws(
    () => verifyContents([...EXPECTED_ENTRIES, "extension/unexpected.txt"]),
    /exact Marketplace artifact allowlist/,
  );
});

test("package verifier rejects a duplicate entry", () => {
  assert.throws(
    () => verifyContents([...EXPECTED_ENTRIES, EXPECTED_ENTRIES[0]]),
    /exact Marketplace artifact allowlist/,
  );
});
