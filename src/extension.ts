"use strict";

import * as vscode from "vscode";
import { CustomizationProvider } from "./customizationProvider";

export async function activate(context: vscode.ExtensionContext) {

	const customizationProvider = new CustomizationProvider();
	vscode.window.registerTreeDataProvider("allElementsTreeView", customizationProvider);
	vscode.commands.registerCommand("customizeElement", (element) => customizationProvider.customizeElement(element));
	vscode.commands.registerCommand("updateCustomizations", () => customizationProvider.updateCustomizations());
	vscode.commands.registerCommand("clearCustomization", (element) => customizationProvider.clearCustomization(element));
	vscode.commands.registerCommand("copyValue", (element) => customizationProvider.copyValue(element));
	vscode.commands.registerCommand("pasteValue", (element) => customizationProvider.pasteValue(element));


	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('workbench.colorCustomizations')) {
			customizationProvider.updateCustomizations();
		}
	}));
}


export function deactivate() {}
