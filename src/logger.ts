import * as vscode from 'vscode';

export class Logger {
  constructor(private outputChannel: vscode.OutputChannel) {}

  info(message: string): void {
    this.outputChannel.appendLine(`[INFO] ${message}`);
  }

  warn(message: string): void {
    this.outputChannel.appendLine(`[WARN] ${message}`);
  }

  error(message: string): void {
    this.outputChannel.appendLine(`[ERROR] ${message}`);
  }

  debug(message: string): void {
    this.outputChannel.appendLine(`[DEBUG] ${message}`);
  }

  show(): void {
    this.outputChannel.show();
  }
}
