import * as assert from 'assert';
import * as cp from 'child_process';
import { EventEmitter } from 'events';
import * as sinon from 'sinon';
import { DaemonManager } from '../../daemon';
import { ConfigManager } from '../../config';
import { Logger } from '../../logger';
import { DaemonState } from '../../types';

suite('DaemonManager', () => {
  let configManager: ConfigManager;
  let mockLogger: Logger;
  let daemonManager: DaemonManager;
  let spawnStub: sinon.SinonStub;

  setup(() => {
    const outputChannel = {
      appendLine: () => {},
      show: () => {},
      dispose: () => {},
    } as any;

    configManager = new ConfigManager();
    mockLogger = new Logger(outputChannel);
    daemonManager = new DaemonManager(configManager, mockLogger, '/path/to/daemon.jar');

    // Create a mock process
    spawnStub = sinon.stub(cp, 'spawn' as any);
    const mockProcess = new EventEmitter() as any;
    mockProcess.stdin = { write: sinon.stub().callsArg(2) };
    mockProcess.stdout = new EventEmitter();
    mockProcess.kill = sinon.stub().returns(true);
    spawnStub.returns(mockProcess);
  });

  teardown(async () => {
    await daemonManager.stop();
    spawnStub.restore();
  });

  test('should start daemon and set state to Running', async () => {
    assert.strictEqual(daemonManager.getState(), DaemonState.Idle);

    const startPromise = daemonManager.start();
    assert.strictEqual(daemonManager.getState(), DaemonState.Starting);

    await startPromise;
    assert.strictEqual(daemonManager.getState(), DaemonState.Running);
  });

  test('should not start daemon twice', async () => {
    await daemonManager.start();
    const callCount = spawnStub.callCount;

    await daemonManager.start();
    assert.strictEqual(spawnStub.callCount, callCount);
  });

  test('should stop daemon and set state to Stopped', async () => {
    await daemonManager.start();
    assert.strictEqual(daemonManager.getState(), DaemonState.Running);

    await daemonManager.stop();
    assert.strictEqual(daemonManager.getState(), DaemonState.Stopped);
  });

  test('should emit stateChange events', async () => {
    const stateChanges: DaemonState[] = [];
    daemonManager.on('stateChange', (state: DaemonState) => {
      stateChanges.push(state);
    });

    await daemonManager.start();
    await daemonManager.stop();

    assert(stateChanges.includes(DaemonState.Starting));
    assert(stateChanges.includes(DaemonState.Running));
    assert(stateChanges.includes(DaemonState.Stopping));
    assert(stateChanges.includes(DaemonState.Stopped));
  });

  test('should return null client when daemon is not running', () => {
    const client = daemonManager.getClient();
    assert.strictEqual(client, null);
  });

  test('should return client when daemon is running', async () => {
    await daemonManager.start();
    const client = daemonManager.getClient();
    assert.notStrictEqual(client, null);
  });
});
