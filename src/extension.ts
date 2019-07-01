"use strict";

import * as vscode from "vscode";
import { ElementProvider, ViewType } from './elementProvider';
import { InfoProvider } from './infoProvider';


export async function activate(context: vscode.ExtensionContext) {

	const infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider("elementInfo", infoProvider);
	vscode.commands.registerCommand("showElementInfo", (element) => infoProvider.setElement(element));

	const elementProvider = new ElementProvider(ViewType.Palette);
	vscode.window.registerTreeDataProvider("standardElementsView", elementProvider);
	vscode.commands.registerCommand("customizeElement", (element) => element.customize());
	vscode.commands.registerCommand("clearCustomization", (element) => element.clear());
	vscode.commands.registerCommand("copy", (element) => element.copy());
	vscode.commands.registerCommand("paste", (element) => element.paste());


	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('workbench.colorCustomizations') || e.affectsConfiguration("workbench.colorTheme")) {
			for(let key in elementProvider.elements){
				elementProvider.elements[key].update();
				elementProvider.refresh(elementProvider.elements[key]);
			}
		}
		if(infoProvider.selectedElement){
			infoProvider.setElement(infoProvider.selectedElement);
			infoProvider.refresh();
		}
	}));
}


export function deactivate() {}
