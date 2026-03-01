export interface FormatRequest {
  source: string;
  style?: string;
  startLine?: number;
  startColumn?: number;
  endLine?: number;
  endColumn?: number;
}

export interface FormatResult {
  formatted: string;
}

export interface ShutdownRequest {}

export interface ShutdownResult {}

export type FormatterStyle = 'PALANTIR';

export interface ExtensionConfig {
  enabled: boolean;
  style: FormatterStyle;
  javaHome: string;
  jvmArgs: string[];
}

export enum DaemonState {
  Idle = 'idle',
  Starting = 'starting',
  Running = 'running',
  Crashed = 'crashed',
  Stopping = 'stopping',
  Stopped = 'stopped',
}
