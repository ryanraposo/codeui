"use strict";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import * as configuration from "./configuration";
import { ViewType } from "./elementsViewProvider";

import ElementsViewProvider from './elementsViewProvider';
import InfoViewProvider from './infoViewProvider';

var elementsViewProvider : ElementsViewProvider;
var infoViewProvider : InfoViewProvider;
var targetingModeStatusBarItem : vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {	

	initializeTargetingModeStatusBarItem();
	
	infoViewProvider = new InfoViewProvider();
	vscode.window.registerTreeDataProvider("elementInfo", infoViewProvider);
	vscode.commands.registerCommand("showElementInfo", (element) => infoViewProvider.updateSelectedElement(element));
	
	vscode.commands.registerCommand("toggleView", () => toggleView());
	vscode.commands.registerCommand("toggleTargetingMode", () => toggleTargetingMode());
	
	elementsViewProvider = new ElementsViewProvider(ViewType.Standard);
	vscode.window.registerTreeDataProvider("elementsView", elementsViewProvider);
	vscode.commands.registerCommand("customize", (element) => elementsViewProvider.customize(element));
	vscode.commands.registerCommand("adjustBrightness", (element) => elementsViewProvider.adjustBrightness(element));
	vscode.commands.registerCommand("clear", (element) => elementsViewProvider.clear(element));
	vscode.commands.registerCommand("copy", (element) => elementsViewProvider.copy(element));

	await context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if(e.affectsConfiguration('workbench.colorTheme') || e.affectsConfiguration('workbench.colorCustomizations')){
			elementsViewProvider.refresh();			
			infoViewProvider.updateTheme();
			infoViewProvider.refresh();
		}
		if(e.affectsConfiguration('codeui.targetingMode')){
			updateTargetingModeStatusBarItem();
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
	if(elementsViewProvider.viewType === ViewType.Standard){
		elementsViewProvider = new ElementsViewProvider(ViewType.Palette);
		vscode.window.registerTreeDataProvider('elementsView', elementsViewProvider);
	}
	else{
		elementsViewProvider = new ElementsViewProvider(ViewType.Standard);
		vscode.window.registerTreeDataProvider('elementsView', elementsViewProvider);
	}
}


export async function chooseScope(workspaceFolder: vscode.WorkspaceFolder) {
	
	const result = await vscode.window.showQuickPick([
		{label:"Global",target:vscode.ConfigurationTarget.Global},
		{label:`Workspace (${workspaceFolder.name})`, target:vscode.ConfigurationTarget.Workspace}
	],
		{placeHolder: 'Select a target...',
	});
	if(result){
		return result.target;
	}

}


export async function showNotification(message : string) {
    const isEnabled = await vscode.workspace.getConfiguration().get("codeui.showNotifications");
	if(isEnabled === true){
		vscode.window.showInformationMessage("CodeUI: " + message);
	}else{
		return;
	}
}


export function getInfoViewProvider() {
	return infoViewProvider;
}


function initializeTargetingModeStatusBarItem() {

	targetingModeStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
	targetingModeStatusBarItem.tooltip = "Targeting mode for customizations applied by CodeUI.";
	targetingModeStatusBarItem.command = "toggleTargetingMode";
	targetingModeStatusBarItem.text = '[CodeUI]:';

	updateTargetingModeStatusBarItem();
	
	targetingModeStatusBarItem.show();
	
}


function updateTargetingModeStatusBarItem() {

	const targetingMode = configuration.getTargetingMode();

	if(targetingMode === 'themeSpecific'){
		targetingModeStatusBarItem.text = '[CodeUI]: Theme-specific';
	} else {
		targetingModeStatusBarItem.text = '[CodeUI]: General';
	}

}


function toggleTargetingMode() {

	const targetingMode = configuration.getTargetingMode();

	if(targetingMode === 'themeSpecific'){
		configuration.setTargetingMode('general');
	} else {
		configuration.setTargetingMode('themeSpecific');
	}
	
}








