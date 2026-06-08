// import { describe, it, beforeEach } from 'node:test';
// import assert from 'node:assert/strict';
// import { useSandbox } from './sandbox.test.js';

// describe('E2E: baton create', () => {
//   const sb = useSandbox();

//   beforeEach(async () => {
//     await sb.runBaton(['init', '--specs', sb.specsPath]);
//     await sb.runBaton(['register', '--name', sb.humanName, '--type', 'human']);
//   });

//   // Manual entry / Flag mode tests
//   it('defaults title to "Issue #<id>" if --title is not provided', async () => {
//     const result = await sb.runBaton(['create', '--description', 'Clean up JWT logic', '--json']);
//     assert.equal(result.exitCode, 0);
//     const data = sb.parseJSON(result);
//     assert.match(data.issue.title, /^Issue #\d+$/);
//   });

//   it('creates an issue with --title only, exits 0', async () => {
//     const result = await sb.runBaton(['create', '--title', 'Fix login bug', '--json']);
//     assert.equal(result.exitCode, 0);
//   });

//   it('creates an issue and assigns an agent with --assignee', async () => {
//     await sb.runBaton(['register', '--name', sb.agentName, '--type', 'agent']);
//     const result = await sb.runBaton([
//       'create',
//       '--title', 'Assigned issue',
//       '--assignee', sb.agentName,
//       '--json'
//     ]);
//     assert.equal(result.exitCode, 0);
//     const data = sb.parseJSON(result);
//     assert.ok(data.issue.assignee_id !== null);
//   });

//   it('returns a valid JSON envelope with --json', async () => {
//     const result = await sb.runBaton(['create', '--title', 'Fix login bug', '--json']);
//     const data = sb.parseJSON(result);
//     assert.equal(data.status, 'success');
//     assert.ok(data.issue);
//     assert.equal(typeof data.issue.id, 'number');
//   });

//   it('stores the correct title', async () => {
//     const result = await sb.runBaton(['create', '--title', 'Fix login bug', '--json']);
//     const data = sb.parseJSON(result);
//     assert.equal(data.issue.title, 'Fix login bug');
//   });

//   it('defaults priority to Low when not specified', async () => {
//     const result = await sb.runBaton(['create', '--title', 'Fix login bug', '--json']);
//     const data = sb.parseJSON(result);
//     // Note: due to serializeIssue normalization, JSON output is lowercase
//     assert.equal(data.issue.priority, 'low');
//   });

//   // Tests for different flag values
//   it('stores priority correctly with title-case --priority High', async () => {
//     const result = await sb.runBaton(['create', '--title', 'Fix login bug', '--priority', 'High', '--json']);
//     const data = sb.parseJSON(result);
//     assert.equal(data.issue.priority, 'high');

//     // verify value in baton.db 
//     const viewResult = await sb.runBaton(['view', String(data.issue.id)]);
//     assert.match(viewResult.stdout, /priority: High/);
//   });

//   it('normalizes uppercase --priority HIGH to High', async () => {
//     const result = await sb.runBaton(['create', '--title', 'Fix login bug', '--priority', 'HIGH', '--json']);
//     assert.equal(result.exitCode, 0);
//     const data = sb.parseJSON(result);
//     assert.equal(data.issue.priority, 'high');

//     // verify value in baton.db
//     const viewResult = await sb.runBaton(['view', String(data.issue.id)]);
//     assert.match(viewResult.stdout, /priority: High/);
//   });

//   it('stores the description if --description is provided', async () => {
//     const result = await sb.runBaton([
//       'create',
//       '--title', 'Fix login bug',
//       '--description', 'Clean up JWT logic',
//       '--json'
//     ]);
//     const data = sb.parseJSON(result);
//     assert.equal(data.issue.description, 'Clean up JWT logic');
//   });

//   it('stores the token limit when --token-limit is provided', async () => {
//     const result = await sb.runBaton([
//       'create',
//       '--title', 'Fix login bug',
//       '--token-limit', '1000',
//       '--json'
//     ]);
//     const data = sb.parseJSON(result);
//     assert.equal(data.issue.token_limit, 1000);
//   });

//   it('stores the correct assignee in the database', async () => {
//     await sb.runBaton(['register', '--name', sb.agentName, '--type', 'agent']);
//     const registerResult = await sb.runBaton(['agents', '--json']);
//     const agents = sb.parseJSON(registerResult);
//     const agent = agents.agents.find(a => a.name === sb.agentName);

//     const result = await sb.runBaton([
//       'create',
//       '--title', 'Assigned issue',
//       '--assignee', sb.agentName,
//       '--json'
//     ]);
//     const data = sb.parseJSON(result);
//     assert.equal(data.issue.assignee_id, agent.id);
//   });

//   it('creates an issue with all flags', async () => {
//     const result = await sb.runBaton([
//       'create',
//       '--title', 'Fix login bug',
//       '--description', 'Clean up JWT logic',
//       '--priority', 'High',
//       '--token-limit', '1000',
//       '--assignee', sb.humanName,
//       '--json'
//     ]);
//     assert.equal(result.exitCode, 0);
//     const data = sb.parseJSON(result);
//     assert.equal(data.issue.title, 'Fix login bug');
//     assert.equal(data.issue.description, 'Clean up JWT logic');
//     assert.equal(data.issue.priority, 'high');
//     assert.equal(data.issue.token_limit, 1000);
//     assert.ok(data.issue.assignee_id !== null);
//   });

//   // Invalid input tests
//   it('exits 2 if flag is invalid', async () => {
//     const result = await sb.runBaton(['create', '--unknown-flag', '--json']);
//     assert.equal(result.exitCode, 2);
//   });

//   it('exits 1 if priority value is invalid', async () => {
//     const result = await sb.runBaton(['create', '--title', 'Fix login bug', '--priority', 'invalid', '--json']);
//     assert.equal(result.exitCode, 1);
//   });

//   it('exits 1 if token limit is a negative number', async () => {
//     const result = await sb.runBaton(['create', '--title', 'Fix login bug', '--token-limit', '-9000', '--json']);
//     assert.equal(result.exitCode, 1);
//   });

//   it('exits 1 if assignee name is not registered', async () => {
//     const result = await sb.runBaton([
//       'create',
//       '--title', 'Assigned issue',
//       '--assignee', 'nonexistent-agent',
//       '--json'
//     ]);
//     assert.equal(result.exitCode, 1);
//     assert.match(result.stderr, /not registered/i);
//   });
// });