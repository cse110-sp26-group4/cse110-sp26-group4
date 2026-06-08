import { describe, it, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { useSandbox } from "./sandbox.test.js";
import { parseJSON } from "./runBaton.test.js";

const sandbox = useSandbox();
let previousBatonAgent;

async function initializeTracker() {
  const minimalSpecsPath = path.join(sandbox.dir, "minimal-specs.md");
  fs.writeFileSync(minimalSpecsPath, "| ID | Priority | Requirement |\n");

  const initResult = await sandbox.runBaton([
    "init",
    "--specs",
    minimalSpecsPath,
  ]);
  assert.equal(initResult.exitCode, 0, `init failed: ${initResult.stderr}`);

  const registerResult = await sandbox.runBaton([
    "register",
    "--name",
    "e2e-agent",
    "--type",
    "agent",
  ]);
  assert.equal(
    registerResult.exitCode,
    0,
    `register failed: ${registerResult.stderr}`,
  );

  const registerSandboxResult = await sandbox.runBaton([
    "register",
    "--name",
    "sandbox-human",
    "--type",
    "human",
  ]);
  assert.equal(
    registerSandboxResult.exitCode,
    0,
    `register sandbox failed: ${registerSandboxResult.stderr}`,
  );
}

async function createIssue({ title, priority = "low", description = "" }) {
  const args = ["create", "--title", title, "--priority", priority, "--json"];
  if (description) {
    args.push("--description", description);
  }

  const result = await sandbox.runBaton(args);
  assert.equal(result.exitCode, 0, `create failed: ${result.stderr}`);
  const json = parseJSON(result);
  assert.equal(json.status, "success");
  return json.issue;
}

async function updateIssueStatus(id, status) {
  const result = await sandbox.runBaton([
    "update",
    String(id),
    "--status",
    status,
    "--priority",
    "High",
    "--json",
  ]);
  assert.equal(result.exitCode, 0, `update failed: ${result.stderr}`);
  return parseJSON(result).issue;
}

beforeEach(async () => {
  previousBatonAgent = process.env.BATON_AGENT;
  process.env.BATON_AGENT = "e2e-agent";
  await initializeTracker();
});

afterEach(() => {
  if (previousBatonAgent === undefined) {
    delete process.env.BATON_AGENT;
  } else {
    process.env.BATON_AGENT = previousBatonAgent;
  }
});

describe("Read-only CLI end-to-end tests", () => {
  describe("baton list", () => {
    it("should list all issues when no filters are applied", async () => {
      await createIssue({ title: "Issue 1" });
      await createIssue({ title: "Issue 2" });
      await createIssue({ title: "Issue 3" });

      const result = await sandbox.runBaton(["list", "--json"]);
      assert.equal(result.exitCode, 0, result.stderr);

      const json = parseJSON(result);
      assert.equal(json.status, "success");
      assert.equal(json.count, 3);
      assert.ok(Array.isArray(json.issues));
    });

    it("should filter issues by status", async () => {
      await createIssue({ title: "Open Issue" });
      const closedIssue = await createIssue({ title: "Closed Issue" });
      await updateIssueStatus(closedIssue.id, "closed");

      const result = await sandbox.runBaton([
        "list",
        "--status",
        "closed",
        "--json",
      ]);
      assert.equal(result.exitCode, 0, result.stderr);

      const json = parseJSON(result);
      assert.equal(json.status, "success");
      assert.equal(json.count, 1);
      assert.equal(json.issues[0].title, "Closed Issue");
    });

    it("should filter issues by priority", async () => {
      await createIssue({ title: "Low Priority", priority: "low" });
      await createIssue({ title: "High Priority", priority: "high" });

      const result = await sandbox.runBaton([
        "list",
        "--priority",
        "high",
        "--json",
      ]);
      assert.equal(result.exitCode, 0, result.stderr);

      const json = parseJSON(result);
      assert.equal(json.status, "success");
      assert.equal(json.count, 1);
      assert.equal(json.issues[0].priority, "high");
    });

    it("should support pagination with --limit", async () => {
      await createIssue({ title: "Issue 1" });
      await createIssue({ title: "Issue 2" });
      await createIssue({ title: "Issue 3" });

      const result = await sandbox.runBaton(["list", "--limit", "2", "--json"]);
      assert.equal(result.exitCode, 0, result.stderr);

      const json = parseJSON(result);
      assert.equal(json.status, "success");
      assert.equal(json.count, 2);
    });

    it("should support pagination with --offset", async () => {
      await createIssue({ title: "Issue 1" });
      await createIssue({ title: "Issue 2" });
      await createIssue({ title: "Issue 3" });

      const result = await sandbox.runBaton([
        "list",
        "--offset",
        "1",
        "--limit",
        "2",
        "--json",
      ]);
      assert.equal(result.exitCode, 0, result.stderr);

      const json = parseJSON(result);
      assert.equal(json.status, "success");
      assert.equal(json.count, 2);
    });

    it("should combine filters with pagination", async () => {
      await createIssue({ title: "High 1", priority: "high" });
      await createIssue({ title: "High 2", priority: "high" });
      await createIssue({ title: "Low 1", priority: "low" });

      const result = await sandbox.runBaton([
        "list",
        "--priority",
        "high",
        "--limit",
        "1",
        "--offset",
        "1",
        "--json",
      ]);
      assert.equal(result.exitCode, 0, result.stderr);

      const json = parseJSON(result);
      assert.equal(json.status, "success");
      assert.equal(json.count, 1);
      assert.equal(json.issues[0].title, "High 2");
    });
  });

  describe("baton view", () => {
    it("should display full issue details in JSON", async () => {
      const issue = await createIssue({
        title: "Full Details Test",
        description: "This is a detailed description",
        priority: "high",
      });

      const result = await sandbox.runBaton([
        "view",
        String(issue.id),
        "--json",
      ]);
      assert.equal(result.exitCode, 0, result.stderr);

      const json = parseJSON(result);
      assert.equal(json.status, "success");
      assert.equal(json.issue.id, issue.id);
      assert.equal(json.issue.title, "Full Details Test");
      assert.equal(json.issue.priority, "high");
      assert.equal(json.issue.description, "This is a detailed description");
    });
  });

  describe("baton search", () => {
    it("should match titles and descriptions case-insensitively", async () => {
      await createIssue({ title: "Login Bug Report" });
      await createIssue({
        title: "Authentication Issue",
        description: "This bug affects login flows",
      });

      const result = await sandbox.runBaton(["search", "login", "--json"]);
      assert.equal(result.exitCode, 0, result.stderr);

      const json = parseJSON(result);
      assert.equal(json.status, "success");
      assert.equal(json.count, 2);
      assert.ok(
        json.issues.some((issue) => issue.title === "Login Bug Report"),
      );
      assert.ok(
        json.issues.some((issue) => issue.title === "Authentication Issue"),
      );
    });
  });

  describe("baton status", () => {
    it("should report correct aggregation of issue counts", async () => {
      await createIssue({ title: "Open Issue" });
      const closedIssue = await createIssue({ title: "Closed Issue" });
      await updateIssueStatus(closedIssue.id, "closed");

      const result = await sandbox.runBaton(["status", "--json"]);
      assert.equal(result.exitCode, 0, result.stderr);

      const json = parseJSON(result);
      assert.equal(json.status, "success");
      assert.equal(json.stats.total, 2);
      assert.equal(json.stats.closed, 1);
      assert.equal(json.stats.open, 1);
    });
  });

  describe("baton log", () => {
    it("should return activity history in JSON", async () => {
      const issue = await createIssue({ title: "Activity Test" });

      const result = await sandbox.runBaton([
        "log",
        String(issue.id),
        "--json",
      ]);
      assert.equal(result.exitCode, 0, result.stderr);

      const json = parseJSON(result);
      assert.equal(json.status, "success");
      assert.equal(json.issue_id, issue.id);
      assert.ok(Array.isArray(json.entries));
      assert.ok(json.entries.some((entry) => entry.action === "creation"));
    });
  });
});
