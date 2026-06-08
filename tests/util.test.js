import { describe, it, afterEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  hasFlag,
  serializeIssue,
  renderOutput,
  renderError,
  parseAndValidateArgs,
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
      assigneeId: null,
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

describe('parseAndValidateArgs', () => {
  const spec = {
    positionals: { min: 1, max: 2 },
    flags: {
      '--json': { type: 'boolean' },
      '--help': { type: 'boolean', alias: '-h' },
      '--priority': { type: 'string', alias: '-p' },
      '--limit': { type: 'number', alias: '-l' },
    },
  };

  it('parses basic flags and positionals', () => {
    const args = ['5', '--priority', 'high', '--json'];
    const result = parseAndValidateArgs(args, spec);

    assert.deepEqual(result.positionals, ['5']);
    assert.equal(result.flags['--priority'], 'high');
    assert.equal(result.flags['--json'], true);
  });

  it('resolves aliases', () => {
    const args = ['10', '-p', 'medium', '-l', '100'];
    const result = parseAndValidateArgs(args, spec);

    assert.equal(result.flags['--priority'], 'medium');
    assert.equal(result.flags['--limit'], 100);
  });

  it('handles multiple positionals', () => {
    const args = ['5', 'Closed due to inactivity'];
    const result = parseAndValidateArgs(args, spec);

    assert.deepEqual(result.positionals, ['5', 'Closed due to inactivity']);
  });

  it('throws error for unknown flag', () => {
    const args = ['5', '--unknown'];
    assert.throws(() => parseAndValidateArgs(args, spec), {
      message: /Unknown flag: --unknown/,
    });
  });

  it('throws error for missing flag value', () => {
    const args = ['5', '--priority'];
    assert.throws(() => parseAndValidateArgs(args, spec), {
      message: /Missing value for --priority/,
    });
  });

  it('throws error for flag value that looks like another flag', () => {
    const args = ['5', '--priority', '--json'];
    assert.throws(() => parseAndValidateArgs(args, spec), {
      message: /Missing value for --priority/,
    });
  });

  it('throws error for invalid numeric value', () => {
    const args = ['5', '--limit', 'abc'];
    assert.throws(() => parseAndValidateArgs(args, spec), {
      message: /Invalid value for --limit: expected a number, got "abc"/,
    });
  });

  it('throws error for too few positionals', () => {
    const args = ['--json'];
    assert.throws(() => parseAndValidateArgs(args, spec), {
      message: /Expected at least 1 positional argument/,
    });
  });

  it('throws error for too many positionals', () => {
    const args = ['1', '2', '3'];
    assert.throws(() => parseAndValidateArgs(args, spec), {
      message: /Expected at most 2 positional arguments/,
    });
  });

  it('handles mixed order of flags and positionals', () => {
    const args = ['--json', '5', '--priority', 'low', 'Re-opening'];
    const result = parseAndValidateArgs(args, spec);

    assert.deepEqual(result.positionals, ['5', 'Re-opening']);
    assert.equal(result.flags['--json'], true);
    assert.equal(result.flags['--priority'], 'low');
  });
});
