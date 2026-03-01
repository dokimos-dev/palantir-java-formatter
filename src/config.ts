import * as vscode from 'vscode';
import { ExtensionConfig, FormatterStyle } from './types';

export class ConfigManager {
  private static readonly CONFIG_NAME = 'palantirJavaFormat';

  getConfig(): ExtensionConfig {
    const config = vscode.workspace.getConfiguration(ConfigManager.CONFIG_NAME);
    return {
      enabled: config.get('enabled', true),
      style: config.get('style', 'PALANTIR') as FormatterStyle,
      javaHome: config.get('javaHome', ''),
      jvmArgs: config.get('jvmArgs', []),
    };
  }

  getJavaExecutable(): string {
    const config = this.getConfig();
    if (config.javaHome) {
      return `${config.javaHome}/bin/java`;
    }
    const javaHome = process.env.JAVA_HOME;
    if (javaHome) {
      return `${javaHome}/bin/java`;
    }
    return 'java';
  }

  onConfigChange(callback: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration(ConfigManager.CONFIG_NAME)) {
        callback();
      }
    });
  }
}
