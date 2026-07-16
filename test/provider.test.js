// Copyright © 2026. Copyright Vertiso Corporation, all rights reserved.

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  MCP_PROVIDER_ID,
  MCP_SERVER_URL,
  createProvider,
  registerProvider,
} = require("../src/provider");

class FakeHttpServerDefinition {
  constructor(label, uri, headers, version) {
    this.label = label;
    this.uri = uri;
    this.headers = headers;
    this.version = version;
  }
}

function fakeVscode() {
  const registrations = [];
  const disposable = { dispose() {} };

  return {
    registrations,
    disposable,
    api: {
      McpHttpServerDefinition: FakeHttpServerDefinition,
      Uri: {
        parse(value) {
          return { toString: () => value };
        },
      },
      lm: {
        registerMcpServerDefinitionProvider(id, provider) {
          registrations.push({ id, provider });
          return disposable;
        },
      },
    },
  };
}

test("provider returns one versioned remote MCP definition", async () => {
  const fake = fakeVscode();
  const provider = createProvider(fake.api, "1.0.0");
  const definitions = await provider.provideMcpServerDefinitions();

  assert.equal(definitions.length, 1);
  assert.equal(definitions[0].label, "Vertiso Memory");
  assert.equal(definitions[0].uri.toString(), MCP_SERVER_URL);
  assert.equal(definitions[0].headers, undefined);
  assert.equal(definitions[0].version, "1.0.0");
});

test("enumerating definitions performs no network request", async (t) => {
  t.mock.method(globalThis, "fetch", () => {
    throw new Error("provider enumeration must not use the network");
  });

  const fake = fakeVscode();
  const provider = createProvider(fake.api, "1.0.0");

  await provider.provideMcpServerDefinitions();
  assert.equal(globalThis.fetch.mock.callCount(), 0);
});

test("registration uses the manifest provider id and retains its disposable", () => {
  const fake = fakeVscode();
  const context = {
    extension: { packageJSON: { version: "1.0.0" } },
    subscriptions: [],
  };

  registerProvider(fake.api, context);

  assert.equal(fake.registrations.length, 1);
  assert.equal(fake.registrations[0].id, MCP_PROVIDER_ID);
  assert.equal(context.subscriptions.length, 1);
  assert.equal(context.subscriptions[0], fake.disposable);
});
