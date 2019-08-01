"use strict";

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
// import { ElementProvider, ViewType } from './elementProvider';
import * as ep from './elementProvider';

import { InfoProvider } from './infoProvider';

var elementProvider : ep.ElementProvider;
var currentViewType : ep.ViewType = ep.ViewType.Standard;
var viewTypeStatusBarItem : vscode.StatusBarItem;


export async function activate(context: vscode.ExtensionContext) {
	
	await clearIconCache();

	const infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider("elementInfo", infoProvider);
	vscode.commands.registerCommand("showElementInfo", (element) => infoProvider.setElement(element));
	
	vscode.commands.registerCommand("toggleView", () => toggleView());
	
	elementProvider = new ep.ElementProvider(ep.ViewType.Standard);
	vscode.window.registerTreeDataProvider("elementsView", elementProvider);
	vscode.commands.registerCommand("customizeGroup", (group) => elementProvider.customizeGroup(group));
	vscode.commands.registerCommand("customizeElement", (element) => element.customize());
	vscode.commands.registerCommand("clearCustomization", (element) => element.clear());
	vscode.commands.registerCommand("adjustBrightness", (element) => elementProvider.adjustBrightness(element));

	vscode.commands.registerCommand("copy", (element) => elementProvider.copy(element));
	// vscode.commands.registerCommand("paste", (element) => elementProvider.paste(element));


	setStatusBarItem(currentViewType);


	context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if (e.affectsConfiguration('workbench.colorCustomizations') || e.affectsConfiguration("workbench.colorTheme")) {
			infoProvider.setElement(infoProvider.selectedElement);
			infoProvider.refresh();
			elementProvider.refresh();
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

	// clearIconCache();

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


function clearIconCache() {

	const cachePath : string = path.join(__filename, "..", "..", "resources", "swatches", "generated");

	fs.readdir(cachePath, function(err, files : any) {
		if (files) {
			for(let fileName of files){
				fs.unlinkSync(path.join(cachePath, fileName));
			}	
		}
	});
}





