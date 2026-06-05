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
    it('agents cannot run approve', async () => {
      // Execute as the AI actor to verify it is blocked
      const result = await sb.runAsAgent(['approve', '1']);
      
      assert.notEqual(result.exitCode, 0);
      assert.match(result.stderr, /restricted to human users only/i);
    });
  });

  describe('human permissions', () => {
    it('humans can run approve', async () => {
      // Execute as the human actor to verify it is allowed
      const result = await sb.runAsHuman(['approve', '1']);      
      assert.equal(result.exitCode, 0);
    });
  });
});
