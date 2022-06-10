'use strict';
import * as vscode from 'vscode';

class Config {
	private config: vscode.WorkspaceConfiguration;

	constructor() {
		this.config = vscode.workspace.getConfiguration();
	}

	getColorThemeName() {
		return this.config.get('workbench.colorTheme');
	}

	getWorkbenchColorCustomizations(scope: vscode.ConfigurationTarget) {
		const customizationSettingsObj = this.config.inspect('workbench.colorCustomizations');
		let workbenchColorCustomizations : any = {};
		
		if (customizationSettingsObj) {
			if (scope === vscode.ConfigurationTarget.Global) {
				workbenchColorCustomizations = customizationSettingsObj.globalValue;
			}
			if (scope === vscode.ConfigurationTarget.Workspace) {
				workbenchColorCustomizations = customizationSettingsObj.workspaceValue;
			}
		}
		if (workbenchColorCustomizations === undefined) {
			return {};
		}
		return workbenchColorCustomizations;
	}

	getWorkspaceRootFolder(): vscode.WorkspaceFolder | undefined {
		if (vscode.workspace.workspaceFolders) {
			return vscode.workspace.workspaceFolders[0] || undefined;
		}
	}

	getTargetingMode(): string | undefined {
		return this.config.get('codeui.targetingMode');
	}

	toggleTargetingMode() {
		this.config = vscode.workspace.getConfiguration();
		const targetingMode = this.getTargetingMode();
		this.config.update(
			'codeui.targetingMode',
			targetingMode == 'general' ? 'themeSpecific' : 'general',
			vscode.ConfigurationTarget.Global
		);
	}

	getPreferredScope() {
		return this.config.get('codeui.preferredScope', 'alwaysAsk');
	}
}

export function getConfig() {
	return new Config();
}
