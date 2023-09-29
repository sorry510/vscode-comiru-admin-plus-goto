'use strict';

import {
    DocumentLinkProvider as vsDocumentLinkProvider,
    TextDocument,
    ProviderResult,
    DocumentLink,
    workspace,
    Position,
    Range,
    Uri
} from "vscode";
import * as util from '../util';

export default class LinkProvider implements vsDocumentLinkProvider {
    public provideDocumentLinks(doc: TextDocument): ProviderResult<DocumentLink[]> {
        let documentLinks = [];
        let config = workspace.getConfiguration('comiru_admin_plus_goto');

        let linesCount = doc.lineCount <= config.maxLinesCount ? doc.lineCount : config.maxLinesCount;
        let index = 0;
        while (index < linesCount) {
            const line = doc.lineAt(index);
            const lineText = line.text;

            const openApiResult = lineText.match(util.OPENAPI_REG);
            if (openApiResult !== null) {
                for (let item of openApiResult) {
                    const startIndex = item.indexOf('ref=');
                    const pathText = item.substring(startIndex + 6).replace(/\"|\'/g, ''); // 去除单双引号和前缀, '@OA\\Parameter(ref="#/components/parameters/Authorization' => '/components/parameters/Authorization'
                    
                    
                    let result = util.getFilePath(pathText, doc, 'openapi');

                    if (result !== null) {
                        let path = result.targetPath;
                        if (result.line) {
                            path = `${path}#${result.line}`;
                        }
                        const filePosition = Uri.parse(path);
                        let start = new Position(line.lineNumber, lineText.indexOf(pathText) - 1);
                        let end = start.translate(0, pathText.length + 1);
                        let documentLink = new DocumentLink(new Range(start, end),filePosition);
                        documentLinks.push(documentLink);
                    };
                }
            }

            index++;
        }

        return documentLinks;
    }
}