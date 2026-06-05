import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createSandbox } from './sandbox.test.js';

describe('E2E: Human project manager workflow', () => {
  it('can set up a project and create work', async () => {
    const sb = createSandbox();

    try {
      // 1. baton init
      const initResult = await sb.runBaton(['init', '--specs', sb.specsPath, '--json']);
      assert.equal(initResult.exitCode, 0, '1. Setup: baton init should succeed');

      // 2. register user and create issue
      await sb.runBaton(['register', '--name', sb.humanName, '--type', 'human']);
      const createResult = await sb.runBaton(['create', '--title', 'E2E Bug', '--priority', 'high', '--json']);
      assert.equal(createResult.exitCode, 0, '2. Log an issue: baton create should succeed');
      const created = sb.parseJSON(createResult);
      const issueId = String(created.issue.id);

      // 3. baton list --status open
      const listResult = await sb.runBaton(['list', '--status', 'open', '--json']);
      assert.equal(listResult.exitCode, 0);
      const list = sb.parseJSON(listResult);
      assert.ok(list.issues.some(i => i.title === 'E2E Bug', '3. Issue should appear in list'));

      // 4. baton update --priority medium
      const updateResult = await sb.runBaton(['update', issueId, '--priority', 'medium', '--json']);
      assert.equal(updateResult.exitCode, 0, '4. Triage issue: baton update should succeed');

      // 5. baton search "E2E Bug"
      const searchResult = await sb.runBaton(['search', 'E2E Bug', '--json']);
      assert.equal(searchResult.exitCode, 0);
      const search = sb.parseJSON(searchResult);
      assert.ok(search.issues.some(i => i.title === 'E2E Bug', '5. Issue should be findable'));

    } finally {
      sb.cleanup();
    }
  });
});