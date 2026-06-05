import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useSandbox } from './sandbox.test.js';
import { stderr } from 'node:process';

describe('Baton Restriction Tests', () => {
  const sb = useSandbox();

  // Common setup for the test suite
  beforeEach(async () => {
    // 1. Initialize the repository structure
    await sb.runAsHuman(['init', '--specs', sb.specsPath]);

    // 2. Register the human actor as a human
    await sb.runAsHuman(['register', '--name', sb.humanName, '--type', 'human']);

    // 3. Register the AI actor as an agent
    await sb.runAsHuman(['register', '--name', sb.agentName, '--type', 'agent']);
  });

  describe('agent restrictions', () => {
    it('agent cannot run baton init', async () => {
      const result = await sb.runAsAgent(['init']);
      assert.notEqual(result.exitCode, 0);
      assert.match(result.stderr, /restricted to human users only/i);
    });

    it('agent cannot run baton approve', async () => {
      const result = await sb.runAsAgent(['approve', '1']);
      assert.notEqual(result.exitCode, 0);
      assert.match(result.stderr, /restricted to human users only/i);
    });

    it('agent cannot run baton priority', async () => {
      const result = await sb.runAsAgent(['priority', '1', 'high']);
      assert.notEqual(result.exitCode, 0);
      assert.match(result.stderr, /restricted to human users only/i);
    });

    it('agent cannot run baton delete', async () => {
      const result = await sb.runAsAgent(['delete', '1']);
      assert.notEqual(result.exitCode, 0);
      assert.match(result.stderr, /restricted to human users only/i);
    });

    it('agent cannot run baton reject', async () => {
      const result = await sb.runAsAgent(['reject', '1', 'needs bug fixes']);
      assert.notEqual(result.exitCode, 0);
      assert.match(result.stderr, /restricted to human users only/i);
    });

    it('agent cannot run baton update --status', async () => {
      const result = await sb.runAsAgent(['update', '--status', 'closed']);
      assert.notEqual(result.exitCode, 0);
      assert.match(result.stderr, /Agents cannot update/i);
    });

    it('agent cannot run baton update --token-limit', async () => {
      const result = await sb.runAsAgent(['update', '--token-limit', '1000']);
      assert.notEqual(result.exitCode, 0);
      assert.match(result.stderr, /Agents cannot update/i);
    });
  });
});
