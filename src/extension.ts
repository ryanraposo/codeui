"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CustomizedElementProvider } from "./elementProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate() {

	const elementProvider = new CustomizedElementProvider();
	vscode.window.registerTreeDataProvider("elementTreeView", elementProvider);

	vscode.commands.registerCommand('elementProvider.editValue', (elementName : string) => elementProvider.editValue(elementName));
	vscode.commands.registerCommand('getCustomizedElements', () => elementProvider.refresh());

}
export function deactivate() {}
