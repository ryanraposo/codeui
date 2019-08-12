"use strict";

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as ep from './elementProvider';

import { InfoProvider } from './infoProvider';
import { showNotification } from './elementProvider';

var elementProvider : ep.ElementProvider;

var defaultViewType : ep.ViewType = ep.ViewType.Standard;
var defaultCustomizationScope : vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;

var viewTypeStatusBarItem : vscode.StatusBarItem;


export async function activate(context: vscode.ExtensionContext) {

	const infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider("elementInfo", infoProvider);
	vscode.commands.registerCommand("showElementInfo", (element) => infoProvider.setElement(element));
	
	vscode.commands.registerCommand("toggleView", () => toggleView());
	vscode.commands.registerCommand("toggleScope", () => toggleScope());
	
	elementProvider = new ep.ElementProvider(defaultViewType, defaultCustomizationScope);
	vscode.window.registerTreeDataProvider("elementsView", elementProvider);
	vscode.commands.registerCommand("customize", (element) => elementProvider.customize(element));
	vscode.commands.registerCommand("adjustBrightness", (element) => elementProvider.adjustBrightness(element));
	vscode.commands.registerCommand("clear", (element) => elementProvider.clear(element));
	vscode.commands.registerCommand("copy", (element) => elementProvider.copy(element));

	setStatusBarItem(defaultCustomizationScope);

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


export function toggleView() {
	if(elementProvider.viewType === ep.ViewType.Standard){
		elementProvider = new ep.ElementProvider(ep.ViewType.Palette, elementProvider.customizationScope);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
	}
	else{
		elementProvider = new ep.ElementProvider(ep.ViewType.Standard, elementProvider.customizationScope);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
	}
}


function toggleScope() {
	if(elementProvider.customizationScope === vscode.ConfigurationTarget.Global){
		if(vscode.workspace.workspaceFolders){ //If a workspace is open...
			elementProvider = new ep.ElementProvider(elementProvider.viewType, vscode.ConfigurationTarget.Workspace);
			vscode.window.registerTreeDataProvider('elementsView', elementProvider);
			setStatusBarItem(vscode.ConfigurationTarget.Workspace);
		}else{
			showNotification("CodeUI: A workspace must be open to switch to workspace customization mode");
		}
	}else{
		elementProvider = new ep.ElementProvider(elementProvider.viewType, vscode.ConfigurationTarget.Global);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
		setStatusBarItem(vscode.ConfigurationTarget.Global);
	}
}


function setStatusBarItem(customizationScope : vscode.ConfigurationTarget) {

	if(viewTypeStatusBarItem){
		viewTypeStatusBarItem.dispose();
	}

	viewTypeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	viewTypeStatusBarItem.command = "toggleScope";
	
	if(customizationScope === vscode.ConfigurationTarget.Global){
		viewTypeStatusBarItem.text = "[CodeUI]: Global";
	}else{
		viewTypeStatusBarItem.text = "[CodeUI]: Workspace";
	}	

	viewTypeStatusBarItem.show();

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







