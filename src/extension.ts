"use strict";

import * as vscode from "vscode";
import { CustomizationProvider, ThemeViewDataProvider } from "./customizationProvider";
import { CurrentTheme } from './theme';
import { FunctionTest } from './functionTest';
import { ElementProvider, ViewType } from './elementProvider';
import { InfoProvider } from './infoProvider';


export async function activate(context: vscode.ExtensionContext) {

	const infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider("elementInfo", infoProvider);
	vscode.commands.registerCommand("showElementInfo", (element) => infoProvider.setElement(element));
	
	const elementProvider = new ElementProvider(ViewType.Standard);
	vscode.window.registerTreeDataProvider("standardElementsView", elementProvider);
	vscode.commands.registerCommand('updateElements', () => elementProvider.updateElements());
	vscode.commands.registerCommand("customizeElement", (element) => elementProvider.customizeElement(element));
	

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('workbench.colorCustomizations')) {
			let currentCustomizations : any = vscode.workspace.getConfiguration().get("workbench.colorCustomizations");
			for(var key in currentCustomizations){
				elementProvider.standardItems.find((element) =>{
					if(element.elementData["fullName"] === key){
						element.update();
						elementProvider.refresh(element);
					}
				});
			}
		}
	}));
}


export function deactivate() {}
