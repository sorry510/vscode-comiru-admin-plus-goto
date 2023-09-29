'use strict';

import { languages, ExtensionContext } from 'vscode';
import LinkProvider from './providers/linkProvider';

export function activate(context: ExtensionContext) {
    const link = languages.registerDocumentLinkProvider(['php', 'html'], new LinkProvider());
    context.subscriptions.push(link);
}

export function deactivate() {
    //
}