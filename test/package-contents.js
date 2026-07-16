// Copyright © 2026. Copyright Vertiso Corporation, all rights reserved.

const assert = require("node:assert/strict");
const path = require("node:path");
const yauzl = require("yauzl");

const EXPECTED_ENTRIES = Object.freeze([
  "[Content_Types].xml",
  "extension.vsixmanifest",
  "extension/LICENSE.txt",
  "extension/assets/logo.png",
  "extension/changelog.md",
  "extension/package.json",
  "extension/readme.md",
  "extension/skills/checkpoint/SKILL.md",
  "extension/skills/handoff/SKILL.md",
  "extension/skills/handoff-resume/SKILL.md",
  "extension/skills/wrap-up/SKILL.md",
  "extension/src/extension.js",
  "extension/src/provider.js",
].sort());

/**
 * Read the packaged VSIX central directory and reject missing required files.
 *
 * @param {string} filename VSIX archive path.
 * @returns {Promise<string[]>} packaged entry names.
 */
function entries(filename) {
  return new Promise((resolve, reject) => {
    yauzl.open(filename, { lazyEntries: true }, (openError, zipfile) => {
      if (openError) {
        reject(openError);
        return;
      }

      const names = [];
      zipfile.on("entry", (entry) => {
        names.push(entry.fileName);
        zipfile.readEntry();
      });
      zipfile.on("end", () => resolve(names));
      zipfile.on("error", reject);
      zipfile.readEntry();
    });
  });
}

/**
 * Reject a VSIX unless its central directory exactly matches the allowlist.
 *
 * @param {string[]} packaged packaged entry names.
 * @returns {void}
 */
function verifyContents(packaged) {
  assert.deepEqual(
    [...packaged].sort(),
    EXPECTED_ENTRIES,
    "VSIX contents match the exact Marketplace artifact allowlist",
  );
}

/**
 * Verify one packaged VSIX artifact.
 *
 * @param {string} archive VSIX archive path.
 * @returns {Promise<void>}
 */
async function verifyArchive(archive) {
  verifyContents(await entries(path.resolve(archive)));
  process.stdout.write(
    `Verified exact allowlist of ${EXPECTED_ENTRIES.length} VSIX entries.\n`,
  );
}

if (require.main === module) {
  const archive = process.argv[2];

  if (!archive) {
    throw new Error("Usage: node test/package-contents.js <extension.vsix>");
  }

  verifyArchive(archive).catch((error) => {
    process.stderr.write(`${error.stack || error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { EXPECTED_ENTRIES, entries, verifyArchive, verifyContents };
