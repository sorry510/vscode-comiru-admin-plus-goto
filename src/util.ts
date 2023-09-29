'use strict';

import { workspace, TextDocument } from 'vscode';
import * as fs from 'fs';
const readLine = require('n-readlines');

const configurationNamespace = 'comiru_admin_plus_goto';

const OPENAPI_TYPE = {
  'components/schemas/': '@OA\\Schema',
  'components/parameters/':  '@OA\\Parameter',
  'components/responses/': '',
};


/**
 * Finds the controller's filepath
 * @param text example A/FooController
 * @param document
 * @param type example view
 */
export function getFilePath(text: string, document: TextDocument, type: string, search?: string) {
  const workspaceFolder = workspace.getWorkspaceFolder(document.uri)?.uri.fsPath || '';
  let strConfigPath = workspace.getConfiguration(configurationNamespace);
  
  const whiteMap = strConfigPath.whiteMap;
  var a = whiteMap["message.200"];
  
  if (type === 'openapi') {
    // 归一化处理
    for (const [key, value] of Object.entries(OPENAPI_TYPE)) {
      let index = text.indexOf(key);
      if (index !== -1) {
        text = text.substring(index + key.length); // 截取后面部分
        if (value !== undefined) {
          // 白名单处理
          if (whiteMap[text]) {
            let filePath = workspaceFolder + whiteMap[text];
            return findInFile(filePath, text);
          }
        }
        break;
      }
    }
  }

  const dirHash: any = {
    'openapi': 'pathOpenapi',
  };

  if (!dirHash[type]) {
    return null;
  }

  for (let configPath of strConfigPath[dirHash[type]].split(',')) {
    let filePath = workspaceFolder + configPath.trim();
    if (!fs.existsSync(filePath)) {
      // 目录不存在，跳过
      continue;
    }

    if (type === 'openapi') {
      // 遍历路由文件夹
      return findInDir(filePath, text);
    }

  }
  return null;
}

function findInDir(dir: string, text: string): any {
  const files = fs.readdirSync(dir);
  for (const filename of files) {
    const targetPath = `${dir}/${filename}`;
    if (fs.statSync(targetPath).isDirectory()) {
      var result = findInDir(targetPath, text);
      if (result) {
        return result;
      }
    } else if (fs.existsSync(targetPath)) {
      var result = findInFile(targetPath, text);
      if (result) {
        return result;
      }
    }
  }
  return null;
}

function findInFile(path: string, text: string): any {
  let file = new readLine(path);
  let lineNum = 0;
  let line: any;
  while (line = file.next()) {
      lineNum++;
      line = line.toString();
      if (line.indexOf(`'${text}'`) !== -1 || line.indexOf(`"${text}"`) !== -1) {
        return { line: lineNum, targetPath: path };
      }
  }
}


export const OPENAPI_REG = /@OA\\.*ref=(['"])[^'"]*/g; // @OA\\Parameter(ref="#/components/parameters/Authorization") => @OA\\Parameter(ref="#/components/parameters/Authorization