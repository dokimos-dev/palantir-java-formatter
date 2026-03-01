import * as vscode from 'vscode';
import { DaemonManager } from './daemon';
import { DaemonState } from './types';

export class StatusBarManager {
  private statusBar: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];

  constructor(private daemonManager: DaemonManager) {
    this.statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    this.statusBar.name = 'Palantir Java Format';
    this.statusBar.command = 'palantirJavaFormat.restartDaemon';

    this.daemonManager.on('stateChange', (state: DaemonState) => {
      this.updateStatus(state);
    });

    this.updateStatus(daemonManager.getState());
    this.statusBar.show();

    this.disposables.push(this.statusBar);
  }

  private updateStatus(state: DaemonState): void {
    switch (state) {
      case DaemonState.Running:
        this.statusBar.text = '$(check) Palantir Format';
        this.statusBar.tooltip = 'Palantir Java Format is running';
        break;
      case DaemonState.Starting:
        this.statusBar.text = '$(sync~spin) Palantir Format';
        this.statusBar.tooltip = 'Palantir Java Format is starting...';
        break;
      case DaemonState.Crashed:
      case DaemonState.Stopped:
        this.statusBar.text = '$(error) Palantir Format';
        this.statusBar.tooltip = 'Palantir Java Format is not running. Click to restart.';
        break;
      case DaemonState.Idle:
      default:
        this.statusBar.text = '$(circle-slash) Palantir Format';
        this.statusBar.tooltip = 'Palantir Java Format is disabled';
        break;
    }
  }

  dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }
}
