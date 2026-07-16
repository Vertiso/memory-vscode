// Copyright © 2026. Copyright Vertiso Corporation, all rights reserved.

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { MCP_PROVIDER_ID } = require("../src/provider");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "package.json")));
const skillNames = ["checkpoint", "handoff", "handoff-resume", "wrap-up"];

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

test("manifest uses stable MCP and Agent Skills contributions", () => {
  assert.equal(manifest.engines.vscode, "^1.109.0");
  assert.deepEqual(manifest.activationEvents, []);
  assert.equal(manifest.enabledApiProposals, undefined);
  assert.deepEqual(manifest.contributes.mcpServerDefinitionProviders, [
    { id: MCP_PROVIDER_ID, label: "Vertiso Memory" },
  ]);
  assert.deepEqual(
    manifest.contributes.chatSkills,
    skillNames.map((name) => ({ path: `./skills/${name}/SKILL.md` })),
  );
});

test("manifest uses Marketplace-safe metadata and packaging hooks", () => {
  assert.equal(manifest.license, "SEE LICENSE IN LICENSE");
  assert.deepEqual(manifest.categories, ["Machine Learning"]);
  assert.equal(
    manifest.bugs.url,
    "https://github.com/Vertiso/memory-vscode/issues",
  );
  assert.equal(manifest.scripts.prepublishOnly, undefined);
  assert.equal(manifest.scripts.typecheck, "tsc -p jsconfig.json");
  assert.equal(
    manifest.scripts["vscode:prepublish"],
    "npm run lint && npm run typecheck && npm test",
  );
  assert.match(manifest.scripts["verify-package"], /package-contents\.js/);
});

test("manifest and lockfile versions remain synchronized", () => {
  const lockfile = JSON.parse(
    fs.readFileSync(path.join(root, "package-lock.json")),
  );

  assert.equal(lockfile.version, manifest.version);
  assert.equal(lockfile.packages[""].version, manifest.version);
});

test("static analysis is pinned to the supported VS Code API", () => {
  const config = JSON.parse(
    fs.readFileSync(path.join(root, "jsconfig.json")),
  );

  assert.equal(manifest.devDependencies["@types/vscode"], "1.109.0");
  assert.equal(manifest.devDependencies.typescript, "5.9.3");
  assert.equal(config.compilerOptions.allowJs, true);
  assert.equal(config.compilerOptions.checkJs, true);
  assert.equal(config.compilerOptions.strict, true);
  assert.deepEqual(config.compilerOptions.types, ["vscode"]);
});

test("bundled Agent Skills have complete standalone structure", () => {
  for (const name of skillNames) {
    const bundled = path.join(root, "skills", name, "SKILL.md");
    assert.equal(fs.existsSync(bundled), true, `${name} is bundled`);

    const content = fs.readFileSync(bundled, "utf8");
    const frontmatter = content.match(
      /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]+)$/,
    );

    assert.notEqual(frontmatter, null, `${name} has YAML frontmatter and a body`);
    assert.match(frontmatter[1], new RegExp(`^name: ${name}$`, "m"));
    assert.match(frontmatter[1], /^description: (?:>-|\S.+)$/m);
  }
});

test("packaged icon is the approved canonical PNG", () => {
  const icon = path.join(root, manifest.icon);

  assert.equal(fs.existsSync(icon), true);
  assert.equal(
    sha256(icon),
    "b359ce74744be94f3697527e38ad9681b2acb88a59eb714274227794646d5a71",
  );
});

test("manifest contains no runtime dependencies or secret-bearing headers", () => {
  assert.equal(manifest.dependencies, undefined);
  assert.equal(JSON.stringify(manifest).includes("Authorization"), false);
  assert.equal(JSON.stringify(manifest).includes("token"), false);
});
