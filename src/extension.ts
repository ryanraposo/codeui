"use strict";

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as ep from './elementProvider';

import { InfoProvider } from './infoProvider';

var elementProvider : ep.ElementProvider;
var currentViewType : ep.ViewType = ep.ViewType.Standard;
var viewTypeStatusBarItem : vscode.StatusBarItem;


export async function activate(context: vscode.ExtensionContext) {

	const infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider("elementInfo", infoProvider);
	vscode.commands.registerCommand("showElementInfo", (element) => infoProvider.setElement(element));
	
	vscode.commands.registerCommand("toggleView", () => toggleView());
	
	elementProvider = new ep.ElementProvider(ep.ViewType.Standard);
	vscode.window.registerTreeDataProvider("elementsView", elementProvider);
	vscode.commands.registerCommand("customize", (element) => elementProvider.customize(element));
	vscode.commands.registerCommand("clearCustomization", (element) => element.clear());
	vscode.commands.registerCommand("adjustBrightness", (element) => elementProvider.adjustBrightness(element));
	vscode.commands.registerCommand("copy", (element) => elementProvider.copy(element));

	setStatusBarItem(currentViewType);

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
		elementProvider = new ep.ElementProvider(ep.ViewType.Palette);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
		setStatusBarItem(ep.ViewType.Palette);
	}
	else{
		elementProvider = new ep.ElementProvider(ep.ViewType.Standard);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
		setStatusBarItem(ep.ViewType.Standard);
	}
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


function setStatusBarItem(viewType : ep.ViewType) {

	if(viewTypeStatusBarItem){
		viewTypeStatusBarItem.dispose();
	}

	viewTypeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	viewTypeStatusBarItem.command = "toggleView";
	
	if(viewType === ep.ViewType.Standard){
		viewTypeStatusBarItem.text = "[CodeUI]: Standard View";
	}else{
		viewTypeStatusBarItem.text = "[CodeUI]: Palette View";
	}	

	viewTypeStatusBarItem.show();

}







