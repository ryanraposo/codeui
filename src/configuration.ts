'use strict';

import * as vscode from 'vscode';

export interface IStringAnyDict {
	[key: string]: any;
}

export function isIStringAnyDict(obj: any): obj is IStringAnyDict {
	const flagInvalid = false;

	if (!obj) {
		return false;
	}

	if (typeof obj !== 'object') {
		return false;
	}

	for (const key in Object.keys(obj)) {
		if (typeof key !== 'string') {
			return false;
		}
	}

	if (obj === {}) {
		return true;
	}

	if (flagInvalid) {
		return false;
	} else {
		return true;
	}
}

function getConfiguration() {
	return vscode.workspace.getConfiguration();
}

function getWorkbenchColorCustomizations() {
	const configuration = getConfiguration();
	return configuration.inspect('workbench.colorCustomizations');
}

export function getEffectiveColorThemeName(): any {
	const configuration = getConfiguration();
	const colorTheme: any = configuration.get('workbench.colorTheme');
	return colorTheme;
}

export function getGlobalWorkbenchColorCustomizations(): IStringAnyDict {
	const workbenchColorCustomizations = getWorkbenchColorCustomizations();

	if (!workbenchColorCustomizations) {
		return {};
	} else {
		const globalValue = workbenchColorCustomizations.globalValue;
		if (!globalValue) {
			return {};
		}
		if (typeof globalValue !== 'object' || globalValue === null) {
			return {};
		} else {
			return globalValue;
		}
	}
}

export function getWorkspaceWorkbenchColorCustomizations(): IStringAnyDict {
	const workbenchColorCustomizations = getWorkbenchColorCustomizations();

	if (!workbenchColorCustomizations) {
		return {};
	} else {
		const workspaceValue = workbenchColorCustomizations.workspaceValue;
		if (!workspaceValue) {
			return {};
		}
		if (typeof workspaceValue !== 'object' || workspaceValue === null) {
			return {};
		} else {
			return workspaceValue;
		}
	}
}

export function getWorkspaceRootFolder(): vscode.WorkspaceFolder | undefined {
	if (vscode.workspace.workspaceFolders) {
		return vscode.workspace.workspaceFolders[0];
	} else {
		return undefined;
	}
}

export function getTargetingMode(): string {
	const configuration = getConfiguration();

	const themeSpecificCustomizations = <string>configuration.get('codeui.targetingMode');

	return themeSpecificCustomizations;
}

export function setTargetingMode(targetingMode: string): void {
	const configuration = getConfiguration();

	configuration.update(
		'codeui.targetingMode',
		targetingMode,
		vscode.ConfigurationTarget.Global
	);

	console.log('test');
}

export function getPreferredScope(): string {
	const configuration = getConfiguration();

	const preferredScope = <string>configuration.get('codeui.preferredScope');

	return preferredScope;
}
