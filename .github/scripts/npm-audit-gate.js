// Copyright © 2026. Copyright Vertiso Corporation, all rights reserved.

// `npm audit --audit-level=high` with a reviewed allow-list
// (../npm-audit-allowlist.json). Fails on a high or critical advisory that is
// not allow-listed, and on an allow-listed advisory npm no longer reports.

const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ALLOWLIST_PATH = path.join(__dirname, "..", "npm-audit-allowlist.json");
const BLOCKING_SEVERITIES = new Set(["high", "critical"]);
const GHSA_ID = /^GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}$/;

/**
 * @typedef {{id: string, severity: string, name: string, title: string, url: string}} Advisory
 */

/**
 * Splits a parsed `npm audit --json` report against the allow-list.
 * @param {{report: any, allowlist: any}} input
 * @returns {{blocking: Advisory[], allowed: Advisory[], stale: string[]}}
 */
function evaluate({ report, allowlist }) {
  const allowedIds = allowlistIds(allowlist);
  const advisories = reportAdvisories(report);
  const reportedIds = new Set(advisories.map((advisory) => advisory.id));
  const gated = advisories.filter((advisory) => BLOCKING_SEVERITIES.has(advisory.severity));

  return {
    blocking: gated.filter((advisory) => !allowedIds.has(advisory.id)),
    allowed: gated.filter((advisory) => allowedIds.has(advisory.id)),
    stale: [...allowedIds].filter((id) => !reportedIds.has(id))
  };
}

/**
 * @param {any} allowlist
 * @returns {Set<string>}
 */
function allowlistIds(allowlist) {
  const entries = allowlist?.advisories;
  if (!Array.isArray(entries)) {
    throw new Error("allow-list must have an advisories array");
  }

  return new Set(entries.map((entry) => {
    if (!GHSA_ID.test(entry?.id ?? "")) {
      throw new Error(`allow-list id is not a GHSA id: ${JSON.stringify(entry?.id)}`);
    }
    if (typeof entry.reason !== "string" || entry.reason.trim() === "") {
      throw new Error(`allow-list entry ${entry.id} has no reason`);
    }
    return entry.id;
  }));
}

/**
 * Collects the advisories of an npm v2 audit report, one per GHSA id.
 * @param {any} report
 * @returns {Advisory[]}
 */
function reportAdvisories(report) {
  if (report?.error) {
    throw new Error(`npm audit failed: ${auditErrorText(report)}`);
  }
  if (report?.auditReportVersion !== 2 || typeof report.vulnerabilities !== "object" ||
      report.vulnerabilities === null) {
    throw new Error("npm audit returned an unexpected report shape");
  }

  /** @type {Map<string, Advisory>} */
  const byId = new Map();
  for (const vulnerability of Object.values(report.vulnerabilities)) {
    for (const via of vulnerability.via ?? []) {
      // A string names the package whose own entry carries the advisory.
      if (typeof via !== "object" || via === null) continue;

      const id = ghsaId(via.url);
      byId.set(id, { id, severity: via.severity, name: via.name, title: via.title, url: via.url });
    }
  }
  return [...byId.values()];
}

/**
 * npm puts the cause of an audit failure in the top-level `message`;
 * `error.summary` is often empty.
 * @param {any} report
 * @returns {string}
 */
function auditErrorText(report) {
  const parts = [report.message, report.error.summary, report.error.detail]
    .filter((part) => typeof part === "string" && part.trim() !== "");
  return parts.length > 0 ? parts.join(" | ") : JSON.stringify(report.error);
}

/**
 * Parses `npm audit --json` output, naming the exit status and the start of
 * the output when it is not JSON.
 * @param {{stdout: string, status: number | null, signal: string | null}} audit
 * @returns {any}
 */
function parseAuditOutput({ stdout, status, signal }) {
  try {
    return JSON.parse(stdout);
  } catch (error) {
    throw new Error(
      `npm audit output is not JSON (exit status ${status}, signal ${signal}): ` +
        JSON.stringify(stdout.slice(0, 500)),
      { cause: error }
    );
  }
}

/**
 * @param {unknown} url
 * @returns {string}
 */
function ghsaId(url) {
  const id = typeof url === "string" ? url.split("/").pop() ?? "" : "";
  if (!GHSA_ID.test(id)) {
    throw new Error(`npm audit advisory has no GHSA URL: ${JSON.stringify(url)}`);
  }
  return id;
}

function main() {
  const audit = spawnSync("npm", ["audit", "--json"], {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    // npm's own warnings and errors go straight to the CI log.
    stdio: ["ignore", "pipe", "inherit"]
  });
  if (audit.error) throw audit.error;

  const { blocking, allowed, stale } = evaluate({
    report: parseAuditOutput(audit),
    allowlist: JSON.parse(fs.readFileSync(ALLOWLIST_PATH, "utf8"))
  });

  for (const advisory of allowed) {
    console.log(`allow-listed: ${advisory.id} (${advisory.severity}) ${advisory.name}: ${advisory.title}`);
  }
  for (const advisory of blocking) {
    console.error(
      `blocking: ${advisory.id} (${advisory.severity}) ${advisory.name}: ${advisory.title} ${advisory.url}`
    );
  }
  for (const id of stale) {
    console.error(
      `stale allow-list entry: npm audit no longer reports ${id}; remove it from .github/npm-audit-allowlist.json`
    );
  }
  if (blocking.length > 0 || stale.length > 0) process.exitCode = 1;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error("npm audit gate failed:", error);
    process.exitCode = 1;
  }
}

module.exports = { evaluate, parseAuditOutput };
