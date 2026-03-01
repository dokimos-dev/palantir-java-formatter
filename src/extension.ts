import * as vscode from 'vscode';
import * as path from 'path';
import { ConfigManager } from './config';
import { Logger } from './logger';
import { DaemonManager } from './daemon';
import { PalantirFormattingProvider } from './formatter';
import { StatusBarManager } from './statusBar';

let daemonManager: DaemonManager;
let configManager: ConfigManager;
let logger: Logger;
let statusBar: StatusBarManager;
let disposables: vscode.Disposable[] = [];

export async function activate(context: vscode.ExtensionContext) {
  const outputChannel = vscode.window.createOutputChannel('Palantir Java Format');
  logger = new Logger(outputChannel);

  logger.info('Palantir Java Format extension activating...');

  configManager = new ConfigManager();
  const config = configManager.getConfig();

  if (!config.enabled) {
    logger.info('Extension is disabled in settings');
    return;
  }

  const daemonJarPath = path.join(context.extensionPath, 'lib', 'formatter-daemon.jar');
  daemonManager = new DaemonManager(configManager, logger, daemonJarPath);
  statusBar = new StatusBarManager(daemonManager);

  // Register formatting provider
  const formattingProvider = new PalantirFormattingProvider(daemonManager, logger);

  disposables.push(
    vscode.languages.registerDocumentFormattingEditProvider('java', formattingProvider)
  );

  disposables.push(
    vscode.languages.registerDocumentRangeFormattingEditProvider('java', formattingProvider)
  );

  // Register commands
  disposables.push(
    vscode.commands.registerCommand('palantirJavaFormat.restartDaemon', async () => {
      logger.info('Restarting daemon...');
      await daemonManager.stop();
      await daemonManager.start();
    })
  );

  disposables.push(
    vscode.commands.registerCommand('palantirJavaFormat.showOutput', () => {
      logger.show();
    })
  );

  // Watch for configuration changes
  disposables.push(
    configManager.onConfigChange(async () => {
      logger.info('Configuration changed, restarting daemon...');
      await daemonManager.stop();
      const newConfig = configManager.getConfig();
      if (newConfig.enabled) {
        await daemonManager.start();
      }
    })
  );

  // Add all disposables to context
  disposables.forEach((d) => context.subscriptions.push(d));
  context.subscriptions.push(statusBar);

  // Start the daemon
  await daemonManager.start();

  logger.info('Palantir Java Format extension activated');
}

export async function deactivate() {
  logger.info('Palantir Java Format extension deactivating...');
  await daemonManager.stop();
  disposables.forEach((d) => d.dispose());
  statusBar.dispose();
}
