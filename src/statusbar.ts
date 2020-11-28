import * as vscode from 'vscode';

import { getConfig } from './configuration';

export class TargetingModeStatusBarItem {
	private instance: vscode.StatusBarItem;

	constructor() {
		this.instance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
		this.instance.tooltip = 'Targeting mode for customizations applied by CodeUI.';
		this.instance.command = 'toggleTargetingMode';
		this.instance.text = '[CodeUI]:';
		this.update();
		this.instance.show();
	}

	update() {
		const config = getConfig();
		const targetingMode = config.getTargetingMode();
		this.instance.text =
			targetingMode === 'themeSpecific' ? '[CodeUI]: Theme-specific' : '[CodeUI]: General';
	}
}
