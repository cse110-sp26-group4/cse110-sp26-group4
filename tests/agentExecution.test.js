// // Node's test runner helpers
// import { describe, it, beforeEach } from "node:test";
// import assert from "node:assert/strict";
// import fs from "node:fs";
// import path from "node:path";

// // Test helpers that create an isolated temp directory and run the CLI
// import { useSandbox } from "./sandbox.test.js";
// // Helper to parse JSON output from the CLI runner
// import { parseJSON } from "./runBaton.test.js";

// const sandbox = useSandbox();

// // Helper to temporarily set `BATON_AGENT` while running a function.
// // Tests switch between a human and an agent identity by toggling this env var.
// function runAs(actor, fn) {
//   const prev = process.env.BATON_AGENT;
//   process.env.BATON_AGENT = actor;
//   return Promise.resolve()
//     .then(() => fn())
//     .finally(() => {
//       if (prev === undefined) delete process.env.BATON_AGENT;
//       else process.env.BATON_AGENT = prev;
//     });
// }

// // initialize the tracker inside the sandbox and register both sandbox actors
// async function initialize() {
//   const minimalSpecsPath = path.join(sandbox.dir, "minimal-specs.md");
//   fs.writeFileSync(minimalSpecsPath, "| ID | Priority | Requirement |\n");

//   const initRes = await sandbox.runBaton(["init", "--specs", minimalSpecsPath]);
//   assert.equal(initRes.exitCode, 0, `init failed: ${initRes.stderr}`);

//   const registerAgent = await sandbox.runBaton([
//     "register",
//     "--name",
//     sandbox.agentName,
//     "--type",
//     "agent",
//   ]);
//   assert.equal(
//     registerAgent.exitCode,
//     0,
//     `register agent failed: ${registerAgent.stderr}`,
//   );
// }

// describe("Agent Execution e2e", () => {
//   beforeEach(async () => {
//     await initialize();
//   });

//   it("agent claims an issue and submits work", async () => {
//     let issueId;

//     // Human creates a new issue.
//     await runAs(sandbox.humanName, async () => {
//       const createRes = await sandbox.runBaton([
//         "create",
//         "--title",
//         "Agent Task",
//         "--priority",
//         "high",
//         "--json",
//       ]);
//       assert.equal(createRes.exitCode, 0, `create failed: ${createRes.stderr}`);

//       const createJson = parseJSON(createRes);
//       assert.equal(createJson.status, "success");
//       assert.ok(createJson.issue && createJson.issue.id);
//       issueId = createJson.issue.id;
//     });

//     // Agent claims the created issue and submits it for review.
//     await runAs(sandbox.agentName, async () => {
//       const claimRes = await sandbox.runAsAgent([
//         "claim",
//         String(issueId),
//         "--json",
//       ]);
//       assert.equal(claimRes.exitCode, 0, `claim failed: ${claimRes.stderr}`);

//       const claimJson = parseJSON(claimRes);
//       assert.equal(claimJson.status, "success");
//       assert.equal(claimJson.issue.id, issueId);

//       const submitRes = await sandbox.runAsAgent([
//         "submit",
//         String(issueId),
//         "--json",
//       ]);
//       assert.equal(submitRes.exitCode, 0, `submit failed: ${submitRes.stderr}`);
//       const submitJson = parseJSON(submitRes);
//       assert.equal(submitJson.status, "success");
//     });

//     // Human verifies the issue is now in-review.
//     await runAs(sandbox.humanName, async () => {
//       const listRes = await sandbox.runBaton([
//         "list",
//         "--status",
//         "in-review",
//         "--json",
//       ]);
//       assert.equal(listRes.exitCode, 0, `list failed: ${listRes.stderr}`);

//       const listJson = parseJSON(listRes);
//       assert.ok(listJson.count >= 1, "expected at least one in-review issue");
//     });
//   });
// });
