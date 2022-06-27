'use strict';
import * as vscode from 'vscode';

import { clearCache } from './utils/cache';

import { getConfig } from './configuration';
import { ElementProvider, ViewMode, getEffectiveColor } from './elements';
import { InfoProvider } from './info';
import { ColorProvider } from './color';
import { TargetingModeStatusBarItem, ColorStatusBarItem } from './statusbar';

let infoProvider: InfoProvider;

const config = getConfig();

/**
 * Called when the extension is first activated.
 */
export function activate(context: vscode.ExtensionContext) {
	const registerCommand = vscode.commands.registerCommand;

	const targetingModeStatusBarItem = new TargetingModeStatusBarItem();
	registerCommand('toggleTargetingMode', () => config.toggleTargetingMode());
	targetingModeStatusBarItem.update(config.getTargetingMode());

	const colorStatusBarItem = new ColorStatusBarItem();

	infoProvider = new InfoProvider();
	vscode.window.registerTreeDataProvider('codeui.views.info', infoProvider);

	const elementProvider: ElementProvider = new ElementProvider(ViewMode.standard);
	vscode.window.registerTreeDataProvider('codeui.views.elements', elementProvider);
	registerCommand('customize', (element) => elementProvider.customize(element));
	registerCommand('adjustBrightness', (element) => elementProvider.adjustBrightness(element));
	registerCommand('clear', (element) => elementProvider.clear(element));
	registerCommand('copy', (element) => elementProvider.copy(element));
	registerCommand('toggleViewMode', () => elementProvider.toggleViewMode());

	const colorProvider = new ColorProvider(context.extensionUri, colorStatusBarItem);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('codeui.views.color', colorProvider)
	);
	registerCommand('copySelectedColor', () => colorProvider.copySelectedColor());

	registerCommand('updateSelectedElement', (element) => {
		infoProvider.updateSelectedElement(element);
		const color = element.effectiveColor;
		if (color) {
			colorProvider.setSelectedColor(color);
		}
	});

	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration((e) => {
			if (e.affectsConfiguration('codeui.targetingMode')) {
				const config = getConfig();
				const targetingMode = config.getTargetingMode();
				targetingModeStatusBarItem.update(targetingMode);
			}
			if (
				e.affectsConfiguration('workbench.colorTheme') ||
				e.affectsConfiguration('workbench.colorCustomizations')
			) {
				elementProvider.refresh();
				infoProvider.updateTheme();
				infoProvider.refresh();
			}
		})
	);
}

/**
 * Called when the extension is deactivated.
 */
export function deactivate() {
	clearCache(__filename);
}

/**
 * Shows a dialog allowing the user to choose a scope.
 */
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

/**
 * Shows a notification from CodeUI.
 */
export async function showNotification(message: string) {
	const isEnabled = await vscode.workspace.getConfiguration().get('codeui.showNotifications');
	if (isEnabled === true) {
		vscode.window.showInformationMessage('CodeUI: ' + message);
	} else {
		return;
	}
}

/**
 * Gets the current Info view provider instance.
 */
export function getInfoProvider() {
	return infoProvider;
}
