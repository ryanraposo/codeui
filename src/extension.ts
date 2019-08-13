"use strict";

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as ep from './elementProvider';
import { InfoProvider } from './infoProvider';

var elementProvider : ep.ElementProvider;

export async function activate(context: vscode.ExtensionContext) {

	const infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider("elementInfo", infoProvider);
	vscode.commands.registerCommand("showElementInfo", (element) => infoProvider.setElement(element));
	
	vscode.commands.registerCommand("toggleView", () => toggleView());
	// vscode.commands.registerCommand("toggleScope", () => toggleScope());
	
	elementProvider = new ep.ElementProvider(ep.ViewType.Standard);
	vscode.window.registerTreeDataProvider("elementsView", elementProvider);
	vscode.commands.registerCommand("customize", (element) => elementProvider.customize(element));
	vscode.commands.registerCommand("adjustBrightness", (element) => elementProvider.adjustBrightness(element));
	vscode.commands.registerCommand("clear", (element) => elementProvider.clear(element));
	vscode.commands.registerCommand("copy", (element) => elementProvider.copy(element));

	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('workbench.colorCustomizations') || e.affectsConfiguration("workbench.colorTheme")) {
			elementProvider.refresh();
			infoProvider.setElement(infoProvider.selectedElement);
			infoProvider.refresh();
		}
		if(infoProvider.selectedElement){
			infoProvider.setElement(infoProvider.selectedElement);
			infoProvider.refresh();
		}
	}));


}


export function deactivate() {

	const directory = path.join(__filename, "..", "..", "resources", "swatches", "generated");

	fs.readdir(directory, (err, files) => {
		if (err){
			throw err;
		}	  
		for (const file of files) {
			if(file !== '.index'){
				fs.unlink(path.join(directory, file), err => {
					if (err) {
						throw err;
					}
				});
			}
		}
	});

}


export function toggleView() {
	if(elementProvider.viewType === ep.ViewType.Standard){
		elementProvider = new ep.ElementProvider(ep.ViewType.Palette);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
	}
	else{
		elementProvider = new ep.ElementProvider(ep.ViewType.Standard);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
	}
}


export async function chooseTarget() {
	let i = 0;
	const result = await vscode.window.showQuickPick([{label:"Global",target:vscode.ConfigurationTarget.Global},{label:"Workspace",target:vscode.ConfigurationTarget.Workspace}], {
		placeHolder: 'Select a target...',
		onDidSelectItem: item => vscode.window.showInformationMessage(`Focus ${++i}: ${item}`)
	});
	if(result){
		return result.target;
	}
}


export function showNotification(message : string) {

    const isEnabled = vscode.workspace.getConfiguration().get("codeui.showNotifications");

	if(isEnabled === true){
		vscode.window.showInformationMessage(message);
	}else{
		return;
	}

}








