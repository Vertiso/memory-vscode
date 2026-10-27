// Copyright © 2026. Copyright Vertiso Corporation, all rights reserved.

const assert = require("node:assert/strict");
const test = require("node:test");

const { evaluate, parseAuditOutput } = require("./npm-audit-gate.js");

const ALLOWED_ID = "GHSA-xcx6-jx8p-x3h5";
const OTHER_ID = "GHSA-2c6m-6gqh-6qg3";

function advisory({ id, severity, name = "pkg" }) {
  return {
    source: 1,
    name,
    dependency: name,
    title: `${id} title`,
    url: `https://github.com/advisories/${id}`,
    severity,
    range: "<9.0.0"
  };
}

// Mirrors npm's v2 report: the advisory object sits under the vulnerable
// package; a dependent lists only that package's name in `via`.
function report(...advisories) {
  const vulnerabilities = {};
  advisories.forEach((entry, index) => {
    vulnerabilities[`pkg-${index}`] = { name: `pkg-${index}`, severity: entry.severity, via: [entry] };
  });
  vulnerabilities.dependent = { name: "dependent", severity: "high", via: ["pkg-0"] };
  return { auditReportVersion: 2, vulnerabilities };
}

function allowlist(...ids) {
  return { advisories: ids.map((id) => ({ id, package: "pkg", reason: "Not reachable." })) };
}

test("passes an allow-listed high advisory", () => {
  const result = evaluate({
    report: report(advisory({ id: ALLOWED_ID, severity: "high" })),
    allowlist: allowlist(ALLOWED_ID)
  });

  assert.deepEqual(result.blocking, []);
  assert.deepEqual(result.stale, []);
  assert.deepEqual(result.allowed.map((entry) => entry.id), [ALLOWED_ID]);
});

test("blocks high and critical advisories that are not allow-listed", () => {
  const result = evaluate({
    report: report(
      advisory({ id: ALLOWED_ID, severity: "high" }),
      advisory({ id: OTHER_ID, severity: "critical" })
    ),
    allowlist: allowlist(ALLOWED_ID)
  });

  assert.deepEqual(result.blocking.map((entry) => entry.id), [OTHER_ID]);
});

test("does not block moderate or low advisories", () => {
  const result = evaluate({
    report: report(
      advisory({ id: ALLOWED_ID, severity: "high" }),
      advisory({ id: OTHER_ID, severity: "moderate" })
    ),
    allowlist: allowlist(ALLOWED_ID)
  });

  assert.deepEqual(result.blocking, []);
});

test("reports an allow-list entry that npm no longer reports", () => {
  const result = evaluate({
    report: { auditReportVersion: 2, vulnerabilities: {} },
    allowlist: allowlist(ALLOWED_ID)
  });

  assert.deepEqual(result.stale, [ALLOWED_ID]);
});

test("fails closed when npm audit reports an error", () => {
  assert.throws(
    () => evaluate({ report: { error: { summary: "registry unreachable" } }, allowlist: allowlist() }),
    /registry unreachable/
  );
});

test("names npm's message when the error summary is empty", () => {
  const failed = {
    message: "request to https://registry.npmjs.org/-/npm/v1/security/audits/quick failed, " +
      "reason: connect ECONNREFUSED",
    error: { summary: "", detail: "" }
  };

  assert.throws(() => evaluate({ report: failed, allowlist: allowlist() }), /ECONNREFUSED/);
});

test("names the exit status and the output head when npm audit prints no JSON", () => {
  assert.throws(
    () => parseAuditOutput({ stdout: "npm error code ENOAUDIT", status: 1, signal: null }),
    /exit status 1.*npm error code ENOAUDIT/
  );
});

test("fails closed on an unexpected report shape", () => {
  assert.throws(
    () => evaluate({ report: { auditReportVersion: 1, advisories: {} }, allowlist: allowlist() }),
    /unexpected report shape/
  );
});

test("fails closed on an advisory without a GHSA URL", () => {
  const bad = { ...advisory({ id: ALLOWED_ID, severity: "high" }), url: "https://example.com/1" };

  assert.throws(() => evaluate({ report: report(bad), allowlist: allowlist() }), /no GHSA URL/);
});

test("rejects an allow-list entry without a reason", () => {
  assert.throws(
    () => evaluate({ report: report(), allowlist: { advisories: [{ id: ALLOWED_ID, reason: " " }] } }),
    /has no reason/
  );
});

test("rejects an allow-list entry that is not a GHSA id", () => {
  assert.throws(
    () => evaluate({ report: report(), allowlist: { advisories: [{ id: "CVE-2026-1", reason: "x" }] } }),
    /not a GHSA id/
  );
});
