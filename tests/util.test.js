import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  hasFlag,
  serializeIssue,
  renderOutput,
  renderError,
} from '../source/util.js';

function captureConsole() {
  const logs = [];
  const errors = [];
  const originalLog = console.log;
  const originalError = console.error;

  console.log = (...args) => logs.push(args.join(' '));
  console.error = (...args) => errors.push(args.join(' '));

  return {
    logs,
    errors,
    restore() {
      console.log = originalLog;
      console.error = originalError;
    },
  };
}

describe('serializeIssue', () => {
  it('normalizes Issue fields to snake_case JSON enums', () => {
    const result = serializeIssue({
      id: 1,
      title: 'Fix login',
      status: 'In-Progress',
      priority: 'High',
      description: 'OAuth fails',
      tokenLimit: 500,
      attemptNum: 2,
      createdAt: '2026-05-17 10:00:00',
      lastUpdated: '2026-05-18 09:00:00',
      assignees: [],
    });

    assert.equal(result.status, 'in_progress');
    assert.equal(result.priority, 'high');
    assert.equal(result.token_limit, 500);
    assert.equal(result.attempt_num, 2);
  });

  it('handles raw DB row field names', () => {
    const result = serializeIssue({
      id: 5,
      title: 'Issue #5',
      status: 'Open',
      priority: 'Medium',
      description: null,
      token_limit: null,
      attempt_num: 0,
      created_at: '2026-05-18 14:00:00',
      last_updated: '2026-05-18 14:00:00',
    });

    assert.equal(result.status, 'open');
    assert.equal(result.priority, 'medium');
  });
});

describe('renderOutput', () => {
  let capture;

  afterEach(() => {
    capture?.restore();
  });

  it('prints JSON when isJson is true', () => {
    capture = captureConsole();
    const envelope = { status: 'success', count: 1, issues: [{ id: 1 }] };

    renderOutput(true, envelope, () => {
      assert.fail('human callback should not run');
    });

    assert.deepEqual(JSON.parse(capture.logs[0]), envelope);
  });

  it('runs human callback when isJson is false', () => {
    capture = captureConsole();
    let ran = false;

    renderOutput(false, { status: 'success', count: 0, issues: [] }, () => {
      ran = true;
    });

    assert.equal(ran, true);
  });
});

describe('renderError', () => {
  let capture;

  afterEach(() => {
    capture?.restore();
  });

  it('prints JSON error when isJson is true', () => {
    capture = captureConsole();
    renderError(true, 'Not found', 'NOT_FOUND');

    assert.deepEqual(JSON.parse(capture.errors[0]), {
      status: 'error',
      code: 'NOT_FOUND',
      message: 'Not found',
    });
  });
});

describe('hasFlag', () => {
  it('detects --json', () => {
    assert.equal(hasFlag(['--status', 'open', '--json'], '--json'), true);
  });
});
