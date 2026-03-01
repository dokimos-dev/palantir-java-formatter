import * as vscode from 'vscode';
import { DaemonManager } from './daemon';
import { Logger } from './logger';
import { FormatRequest, FormatResult } from './types';

export class PalantirFormattingProvider
  implements vscode.DocumentFormattingEditProvider, vscode.DocumentRangeFormattingEditProvider
{
  constructor(
    private daemonManager: DaemonManager,
    private logger: Logger
  ) {}

  async provideDocumentFormattingEdits(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
    return this.formatDocument(document, null);
  }

  async provideDocumentRangeFormattingEdits(
    document: vscode.TextDocument,
    range: vscode.Range
  ): Promise<vscode.TextEdit[]> {
    return this.formatDocument(document, range);
  }

  private async formatDocument(
    document: vscode.TextDocument,
    _range: vscode.Range | null
  ): Promise<vscode.TextEdit[]> {
    const client = this.daemonManager.getClient();
    if (!client) {
      this.logger.warn('Daemon is not running, cannot format');
      return [];
    }

    const source = document.getText();
    this.logger.info(`Formatting ${document.fileName} (${source.length} chars)`);

    try {
      const request: FormatRequest = {
        source,
        style: 'PALANTIR',
      };

      const result = await client.request<FormatResult>('format', request);
      const formatted = result.formatted;

      if (formatted === source) {
        this.logger.info('No changes needed');
        return [];
      }

      this.logger.info(`Formatted successfully (${formatted.length} chars)`);
      const firstLine = document.lineAt(0);
      const lastLine = document.lineAt(document.lineCount - 1);
      const fullRange = new vscode.Range(firstLine.range.start, lastLine.range.end);

      return [vscode.TextEdit.replace(fullRange, formatted)];
    } catch (error) {
      this.logger.error(`Formatting failed: ${error}`);
      return [];
    }
  }
}
