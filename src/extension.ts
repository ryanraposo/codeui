"use strict";

import * as vscode from "vscode";
import { ElementProvider, ViewType } from './elementProvider';
import { InfoProvider } from './infoProvider';

var currentViewType : ViewType = ViewType.Standard;

var elementProvider : ElementProvider;


export async function activate(context: vscode.ExtensionContext) {

	const infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider("elementInfo", infoProvider);
	vscode.commands.registerCommand("showElementInfo", (element) => infoProvider.setElement(element));

	createView();
	vscode.commands.registerCommand("customizeElement", (element) => element.customize());
	vscode.commands.registerCommand("clearCustomization", (element) => element.clear());
	vscode.commands.registerCommand("copy", (element) => element.copy());
	vscode.commands.registerCommand("paste", (element) => element.paste());

	vscode.commands.registerCommand("toggleView", () => toggleView());



	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('workbench.colorCustomizations') || e.affectsConfiguration("workbench.colorTheme")) {
			for(let key in elementProvider.elements){
					elementProvider.elements[key].update();
					elementProvider.refresh(elementProvider.elements[key]);
				}
			elementProvider.refresh();
		}
		if(infoProvider.selectedElement){
			infoProvider.setElement(infoProvider.selectedElement);
			infoProvider.refresh();
		}
	}));
}

function createView(): vscode.TreeDataProvider<any> {
	elementProvider = new ElementProvider(currentViewType);

	return elementProvider;

}

export function toggleView(){
	if(currentViewType === ViewType.Standard){
		currentViewType = ViewType.Palette;
		elementProvider = new ElementProvider(ViewType.Palette);
		vscode.window.registerTreeDataProvider("elementsView", elementProvider);
		return;

	}
	if(currentViewType === ViewType.Palette){
		currentViewType = ViewType.Standard;
		elementProvider = new ElementProvider(ViewType.Standard);
		vscode.window.registerTreeDataProvider("elementsView", elementProvider);
		return;
	}
}


export function deactivate() {}
