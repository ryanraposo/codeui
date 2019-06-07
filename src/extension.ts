"use strict";
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { CustomizationProvider } from "./customizationProvider";

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate() {

	const customizationProvider = new CustomizationProvider();
	vscode.window.registerTreeDataProvider("allElementsTreeView", customizationProvider);
	vscode.commands.registerCommand("updateCustomizedElements", () => customizationProvider.updateCustomizedElements());
	// vscode.commands.registerCommand('elementProvider.editValue', (elementName : string) => elementProvider.editValue(elementName));

}
export function deactivate() {}
