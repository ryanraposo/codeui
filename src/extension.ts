"use strict";

import * as vscode from "vscode";
import { CustomizationProvider, ThemeViewDataProvider } from "./customizationProvider";
import { CurrentTheme } from './theme';
import { FunctionTest } from './functionTest';

export async function activate(context: vscode.ExtensionContext) {

	const customizationProvider = new CustomizationProvider();
	vscode.window.registerTreeDataProvider("allElementsTreeView", customizationProvider);
	vscode.commands.registerCommand("editCustomization", (element) => customizationProvider.editCustomization(element));
	vscode.commands.registerCommand("customizeFromList", (element) => customizationProvider.customizeElementFromList(element));
	vscode.commands.registerCommand("updateCustomizations", () => customizationProvider.updateCustomizations());
	vscode.commands.registerCommand("clearCustomization", (element) => customizationProvider.clearCustomization(element));
	vscode.commands.registerCommand("copyValue", (element) => customizationProvider.copyValue(element));
	vscode.commands.registerCommand("pasteValue", (element) => customizationProvider.pasteValue(element));
	vscode.commands.registerCommand("writeCustomizationsToSettings", (customizations) =>customizationProvider.writeCustomizationsToSettings(customizations));
// Set watch on 'workbench.colorCustomizations' config in User settings

context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('workbench.colorCustomizations')) {
			customizationProvider.updateCustomizations();
		}
	}));

// Get current theme and its customizations

	var currentTheme = new CurrentTheme();
	let themeObject = currentTheme.getThemeObject();

// Register Current Theme view

	const themeViewDataProvider = new ThemeViewDataProvider(themeObject);
	vscode.window.registerTreeDataProvider("themeCustomizationView", themeViewDataProvider);
	vscode.commands.registerCommand("customizeTargetPaletteGroup", (element) => themeViewDataProvider.customizeTargetPaletteGroup(element));
	vscode.commands.registerCommand("darkenAllWithValue", (element) => themeViewDataProvider.darkenAllElementsWithColor(element));

}


export function deactivate() {}
