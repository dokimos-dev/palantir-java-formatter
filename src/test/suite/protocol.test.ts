import * as assert from 'assert';
import { Readable, Writable } from 'stream';
import { EventEmitter } from 'events';
import { ProtocolClient } from '../../protocol';
import { Logger } from '../../logger';

class MockProcess extends EventEmitter {
  stdin: Writable;
  stdout: Readable;

  constructor() {
    super();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { Readable, Writable } = require('stream');

    this.stdout = new Readable({
      read(): void {},
    });

    this.stdin = new Writable({
      write(_chunk: unknown, _encoding: unknown, callback: () => void): void {
        callback();
      },
    });
  }

  kill(_signal?: string): boolean {
    return true;
  }
}

suite('ProtocolClient', () => {
  let mockProcess: MockProcess;
  let mockLogger: Logger;
  let client: ProtocolClient;

  setup(() => {
    mockProcess = new MockProcess();
    const outputChannel = {
      appendLine: () => {},
      show: () => {},
      dispose: () => {},
    } as any;
    mockLogger = new Logger(outputChannel);
    client = new ProtocolClient(mockProcess, mockLogger);
  });

  teardown(() => {
    client.dispose();
  });

  test('should send request and receive response', async () => {
    const promise = client.request('test', { foo: 'bar' });

    // Simulate receiving a response
    setTimeout(() => {
      mockProcess.stdout.push('{"id":"1","result":{"baz":"qux"}}\n');
    }, 10);

    const result = await promise;
    assert.deepStrictEqual(result, { baz: 'qux' });
  });

  test('should handle timeout', async () => {
    const promise = client.request('test', { foo: 'bar' }, 100);

    try {
      await promise;
      assert.fail('Should have thrown');
    } catch (error: any) {
      assert.match(error.message, /timeout/i);
    }
  });

  test('should handle multiple responses', async () => {
    const promise1 = client.request('test1', {});
    const promise2 = client.request('test2', {});

    setTimeout(() => {
      mockProcess.stdout.push('{"id":"2","result":"response2"}\n');
      mockProcess.stdout.push('{"id":"1","result":"response1"}\n');
    }, 10);

    const [result1, result2] = await Promise.all([promise1, promise2]);
    assert.strictEqual(result1, 'response1');
    assert.strictEqual(result2, 'response2');
  });

  test('should handle error responses', async () => {
    const promise = client.request('test', {});

    setTimeout(() => {
      mockProcess.stdout.push(
        '{"id":"1","error":{"code":"TEST_ERROR","message":"Test error message"}}\n'
      );
    }, 10);

    try {
      await promise;
      assert.fail('Should have thrown');
    } catch (error: any) {
      assert.match(error.message, /TEST_ERROR/);
      assert.match(error.message, /Test error message/);
    }
  });

  test('should handle partial buffering', async () => {
    const promise = client.request('test', {});

    setTimeout(() => {
      // Send response in chunks
      mockProcess.stdout.push('{"id":"1","result"');
      mockProcess.stdout.push(':"test"}\n');
    }, 10);

    const result = await promise;
    assert.strictEqual(result, 'test');
  });

  test('should ignore malformed JSON', async () => {
    const promise = client.request('test', {}, 100);

    setTimeout(() => {
      mockProcess.stdout.push('invalid json\n');
      mockProcess.stdout.push('{"id":"1","result":"valid"}\n');
    }, 10);

    const result = await promise;
    assert.strictEqual(result, 'valid');
  });
});
