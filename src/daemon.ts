import * as cp from 'child_process';
import { EventEmitter } from 'events';
import { ConfigManager } from './config';
import { Logger } from './logger';
import { ProtocolClient } from './protocol';
import { DaemonState } from './types';

export class DaemonManager extends EventEmitter {
  private state: DaemonState = DaemonState.Idle;
  private process: cp.ChildProcess | null = null;
  private client: ProtocolClient | null = null;
  private crashCount = 0;
  private maxCrashes = 3;
  private crashDelay = 2000;
  private intentionalStop = false;

  constructor(
    private configManager: ConfigManager,
    private logger: Logger,
    private daemonJarPath: string
  ) {
    super();
  }

  async start(): Promise<void> {
    if (this.state === DaemonState.Running || this.state === DaemonState.Starting) {
      return;
    }

    this.intentionalStop = false;
    this.setState(DaemonState.Starting);

    try {
      const javaExe = this.configManager.getJavaExecutable();
      const config = this.configManager.getConfig();

      const args = [
        '--add-exports',
        'jdk.compiler/com.sun.tools.javac.api=ALL-UNNAMED',
        '--add-exports',
        'jdk.compiler/com.sun.tools.javac.file=ALL-UNNAMED',
        '--add-exports',
        'jdk.compiler/com.sun.tools.javac.parser=ALL-UNNAMED',
        '--add-exports',
        'jdk.compiler/com.sun.tools.javac.tree=ALL-UNNAMED',
        '--add-exports',
        'jdk.compiler/com.sun.tools.javac.util=ALL-UNNAMED',
        ...config.jvmArgs,
        '-jar',
        this.daemonJarPath,
      ];

      this.logger.debug(`Starting daemon: ${javaExe} ${args.join(' ')}`);

      this.process = cp.spawn(javaExe, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      if (this.process.stderr) {
        this.process.stderr.on('data', (data) => {
          this.logger.debug(`[daemon stderr] ${data.toString().trim()}`);
        });
      }

      this.process.on('error', (err) => {
        this.logger.error(`Daemon process error: ${err.message}`);
        if (!this.intentionalStop) {
          this.handleCrash();
        }
      });

      this.process.on('exit', (code, signal) => {
        if (this.intentionalStop) {
          this.logger.info(`Daemon stopped (code=${code}, signal=${signal})`);
        } else {
          this.logger.warn(`Daemon exited unexpectedly (code=${code}, signal=${signal})`);
          this.handleCrash();
        }
      });

      this.client = new ProtocolClient(this.process, this.logger);
      this.crashCount = 0;
      this.setState(DaemonState.Running);
      this.logger.info('Daemon started successfully');
    } catch (error) {
      this.logger.error(`Failed to start daemon: ${error}`);
      this.handleCrash();
    }
  }

  private handleCrash(): void {
    this.crashCount++;
    this.setState(DaemonState.Crashed);

    if (this.crashCount < this.maxCrashes) {
      this.logger.warn(
        `Daemon crashed (${this.crashCount}/${this.maxCrashes}), restarting in ${this.crashDelay}ms...`
      );
      setTimeout(() => this.start(), this.crashDelay);
    } else {
      this.logger.error('Daemon crashed too many times, giving up');
      this.setState(DaemonState.Stopped);
    }
  }

  async stop(): Promise<void> {
    if (this.state === DaemonState.Stopped || this.state === DaemonState.Idle) {
      return;
    }

    this.intentionalStop = true;
    this.setState(DaemonState.Stopping);

    if (this.client) {
      this.client.dispose();
      this.client = null;
    }

    if (this.process) {
      const proc = this.process;
      this.process = null;
      proc.kill('SIGTERM');
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (!proc.killed) {
            proc.kill('SIGKILL');
          }
          resolve();
        }, 2000);
        proc.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    this.setState(DaemonState.Stopped);
  }

  getClient(): ProtocolClient | null {
    if (this.state === DaemonState.Running && this.client) {
      return this.client;
    }
    return null;
  }

  getState(): DaemonState {
    return this.state;
  }

  private setState(newState: DaemonState): void {
    if (this.state !== newState) {
      this.state = newState;
      this.emit('stateChange', newState);
    }
  }

  dispose(): void {
    this.stop();
    this.removeAllListeners();
  }
}
