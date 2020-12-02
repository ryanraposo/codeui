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
		const customizations = this.config.inspect('workbench.colorCustomizations');
		if (customizations) {
			return scope == vscode.ConfigurationTarget.Global
				? customizations.globalValue
				: customizations.workspaceValue;
		}
		return {};
	}

	getWorkspaceRootFolder(): vscode.WorkspaceFolder | undefined {
		if (vscode.workspace.workspaceFolders) {
			return vscode.workspace.workspaceFolders[0] || undefined;
		}
	}

	getTargetingMode() {
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
