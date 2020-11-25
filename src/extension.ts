'use strict';
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import * as config from './configuration';
import { ElementProvider, ViewMode } from './elements';
import { InfoProvider } from './info';

let elementProvider: ElementProvider;
let infoProvider: InfoProvider;

let targetingModeStatusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
	initializeTargetingModeStatusBarItem();

	infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider('codeui.views.info', infoProvider);
	vscode.commands.registerCommand('showElementInfo', (element) =>
		infoProvider.updateSelectedElement(element)
	);

	vscode.commands.registerCommand('toggleView', () => toggleView());
	vscode.commands.registerCommand('toggleTargetingMode', () => toggleTargetingMode());

	elementProvider = new ElementProvider(ViewMode.standard);
	vscode.window.registerTreeDataProvider('codeui.views.elements', elementProvider);
	vscode.commands.registerCommand('customize', (element) =>
		elementProvider.customize(element)
	);
	vscode.commands.registerCommand('adjustBrightness', (element) =>
		elementProvider.adjustBrightness(element)
	);
	vscode.commands.registerCommand('clear', (element) => elementProvider.clear(element));
	vscode.commands.registerCommand('copy', (element) => elementProvider.copy(element));

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (
				e.affectsConfiguration('workbench.colorTheme') ||
				e.affectsConfiguration('workbench.colorCustomizations')
			) {
				elementProvider.refresh();
				infoProvider.updateTheme();
				infoProvider.refresh();
			}
			if (e.affectsConfiguration('codeui.targetingMode')) {
				updateTargetingModeStatusBarItem();
			}
		})
	);
}

export function deactivate() {
	const directory = path.join(
		__filename,
		'..',
		'..',
		'resources',
		'swatches',
		'generated'
	);
	fs.readdir(directory, (err, files) => {
		if (err) {
			throw err;
		}
		for (const file of files) {
			if (file !== '.index') {
				fs.unlink(path.join(directory, file), (err) => {
					if (err) {
						throw err;
					}
				});
			}
		}
	});
}

export function toggleView() {
	if (elementProvider.viewMode === ViewMode.standard) {
		elementProvider = new ElementProvider(ViewMode.palette);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
	} else {
		elementProvider = new ElementProvider(ViewMode.standard);
		vscode.window.registerTreeDataProvider('elementsView', elementProvider);
	}
}

export async function chooseScope(workspaceFolder: vscode.WorkspaceFolder) {
	const result = await vscode.window.showQuickPick(
		[
			{ label: 'Global', target: vscode.ConfigurationTarget.Global },
			{
				label: `Workspace (${workspaceFolder.name})`,
				target: vscode.ConfigurationTarget.Workspace,
			},
		],
		{ placeHolder: 'Select a target...' }
	);
	if (result) {
		return result.target;
	}
}

export async function showNotification(message: string) {
	const isEnabled = await vscode.workspace
		.getConfiguration()
		.get('codeui.showNotifications');
	if (isEnabled === true) {
		vscode.window.showInformationMessage('CodeUI: ' + message);
	} else {
		return;
	}
}

export function getInfoProvider() {
	return infoProvider;
}

function initializeTargetingModeStatusBarItem() {
	targetingModeStatusBarItem = vscode.window.createStatusBarItem(
		vscode.StatusBarAlignment.Right
	);
	targetingModeStatusBarItem.tooltip =
		'Targeting mode for customizations applied by CodeUI.';
	targetingModeStatusBarItem.command = 'toggleTargetingMode';
	targetingModeStatusBarItem.text = '[CodeUI]:';

	updateTargetingModeStatusBarItem();

	targetingModeStatusBarItem.show();
}

function updateTargetingModeStatusBarItem() {
	const targetingMode = config.getTargetingMode();

	if (targetingMode === 'themeSpecific') {
		targetingModeStatusBarItem.text = '[CodeUI]: Theme-specific';
	} else {
		targetingModeStatusBarItem.text = '[CodeUI]: General';
	}
}

function toggleTargetingMode() {
	const targetingMode = config.getTargetingMode();

	if (targetingMode === 'themeSpecific') {
		config.setTargetingMode('general');
	} else {
		config.setTargetingMode('themeSpecific');
	}
}
