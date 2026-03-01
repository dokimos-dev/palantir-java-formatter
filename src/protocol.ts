import { ChildProcess } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from './logger';

export interface ProtocolRequest {
  id: string;
  method: string;
  params: unknown;
}

export interface ProtocolResponse {
  id: string;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

export class ProtocolClient {
  private pendingRequests = new Map<string, (response: ProtocolResponse) => void>();
  private buffer = '';

  constructor(
    private process: ChildProcess,
    private logger: Logger
  ) {
    if (!process.stdout) {
      throw new Error('Process stdout is not available');
    }

    process.stdout.on('data', (data) => this.handleData(data));
    process.on('error', (err) => {
      this.logger.error(`Process error: ${err.message}`);
    });
  }

  async request<T>(method: string, params: unknown, timeout = 30000): Promise<T> {
    const id = uuidv4();
    const request: ProtocolRequest = { id, method, params };

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`Request timeout for method: ${method}`));
      }, timeout);

      this.pendingRequests.set(id, (response) => {
        clearTimeout(timeoutHandle);
        if (response.error) {
          reject(new Error(`${response.error.code}: ${response.error.message}`));
        } else {
          resolve(response.result as T);
        }
      });

      const json = JSON.stringify(request) + '\n';
      this.logger.debug(`Sending request: ${method} (id=${id})`);
      if (!this.process.stdin) {
        clearTimeout(timeoutHandle);
        this.pendingRequests.delete(id);
        reject(new Error('Process stdin is not available'));
        return;
      }

      this.process.stdin.write(json, (err) => {
        if (err) {
          clearTimeout(timeoutHandle);
          this.pendingRequests.delete(id);
          reject(err);
        }
      });
    });
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString('utf-8');
    this.processBuffer();
  }

  private processBuffer(): void {
    let lastNewlineIndex = this.buffer.lastIndexOf('\n');
    if (lastNewlineIndex === -1) {
      return;
    }

    const lines = this.buffer.substring(0, lastNewlineIndex).split('\n');
    this.buffer = this.buffer.substring(lastNewlineIndex + 1);

    for (const line of lines) {
      if (line.trim()) {
        try {
          const response: ProtocolResponse = JSON.parse(line);
          this.logger.debug(`Received response for id=${response.id}`);
          const handler = this.pendingRequests.get(response.id);
          if (handler) {
            this.pendingRequests.delete(response.id);
            handler(response);
          } else {
            this.logger.warn(`No handler for response id=${response.id}`);
          }
        } catch (error) {
          this.logger.error(`Failed to parse response: ${error}`);
        }
      }
    }
  }

  dispose(): void {
    this.pendingRequests.clear();
    this.buffer = '';
  }
}
