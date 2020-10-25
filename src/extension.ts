"use strict";

import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import * as ep from './elementProvider';
import { InfoProvider } from './infoProvider';

import * as configuration from "./configuration";

var elementProvider : ep.ElementProvider;
var infoProvider : InfoProvider;

var targetingModeStatusBarItem : vscode.StatusBarItem;

export async function activate(context: vscode.ExtensionContext) {	

	initializeTargetingModeStatusBarItem();
	
	infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider("elementInfo", infoProvider);
	vscode.commands.registerCommand("showElementInfo", (element) => infoProvider.updateSelectedElement(element));
	
	vscode.commands.registerCommand("toggleView", () => toggleView());
	vscode.commands.registerCommand("toggleTargetingMode", () => toggleTargetingMode());
	
	elementProvider = new ep.ElementProvider(ep.ViewType.Standard);
	vscode.window.registerTreeDataProvider("elementsView", elementProvider);
	vscode.commands.registerCommand("customize", (element) => elementProvider.customize(element));
	vscode.commands.registerCommand("adjustBrightness", (element) => elementProvider.adjustBrightness(element));
	vscode.commands.registerCommand("clear", (element) => elementProvider.clear(element));
	vscode.commands.registerCommand("copy", (element) => elementProvider.copy(element));

	await context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(e => {
		if(e.affectsConfiguration('workbench.colorTheme') || e.affectsConfiguration('workbench.colorCustomizations')){
			elementProvider.refresh();			
			infoProvider.updateTheme();
			infoProvider.refresh();
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
	if(elementProvider.viewType === ep.ViewType.Standard){
		elementProvider = new ep.ElementProvider(ep.ViewType.Palette);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
	}
	else{
		elementProvider = new ep.ElementProvider(ep.ViewType.Standard);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
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


export function getInfoProvider() {
	return infoProvider;
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








