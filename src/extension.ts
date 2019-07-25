"use strict";

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { ElementProvider, ViewType } from './elementProvider';
import { InfoProvider } from './infoProvider';
import { NONAME } from "dns";

var currentViewType : ViewType = ViewType.Standard;

var elementProvider : ElementProvider;


export async function activate(context: vscode.ExtensionContext) {

	const infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider("elementInfo", infoProvider);
	vscode.commands.registerCommand("showElementInfo", (element) => infoProvider.setElement(element));

	elementProvider = new ElementProvider(ViewType.Standard);
	vscode.window.registerTreeDataProvider("elementsView", elementProvider);
	vscode.commands.registerCommand("customizeGroup", (group) => elementProvider.customizeGroup(group));
	vscode.commands.registerCommand("customizeElement", (element) => element.customize());
	vscode.commands.registerCommand("clearCustomization", (element) => element.clear());
	vscode.commands.registerCommand("copy", (element) => element.copy());
	vscode.commands.registerCommand("paste", (element) => element.paste());
	vscode.commands.registerCommand("darken", (item) => elementProvider.darken(item));
	vscode.commands.registerCommand("lighten", (item) => elementProvider.lighten(item));


	vscode.commands.registerCommand("toggleView", () => toggleView());

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('workbench.colorCustomizations') || e.affectsConfiguration("workbench.colorTheme")) {
			elementProvider.refresh();
		}
		if(infoProvider.selectedElement){
			infoProvider.setElement(infoProvider.selectedElement);
			infoProvider.refresh();
		}
	}));
	
}

function toggleView() {
	if(elementProvider.viewType === ViewType.Standard){
		elementProvider = new ElementProvider(ViewType.Palette);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
	}
	else{
		elementProvider = new ElementProvider(ViewType.Standard);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
	}
}

export function deactivate() {}
