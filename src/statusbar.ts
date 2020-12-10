import * as vscode from 'vscode';

/**
 * A command status bar item. Displays and toggles contributed setting 'codeui.targetingMode'.
 */
export class TargetingModeStatusBarItem {
	private instance: vscode.StatusBarItem;

	constructor() {
		this.instance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
		this.instance.tooltip = 'Targeting mode for customizations applied by CodeUI.';
		this.instance.command = 'toggleTargetingMode';
		this.instance.text = '[CodeUI]:';
		this.instance.show();
	}
	/**
	 * Updates the text content of the status bar item.
	 *
	 */
	update(targetingMode: string | undefined) {
		this.instance.text =
			targetingMode === 'themeSpecific' ? '[CodeUI]: Theme-specific' : '[CodeUI]: General';
	}
}

/**
 * A command status bar item. Displays hex and hue of selected color from the 'Color' view.
 * Copies to clipboard on click.
 */
export class ColorStatusBarItem {
	private instance: vscode.StatusBarItem;
	constructor() {
		this.instance = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
		this.instance.text = '';
		this.instance.command = 'copySelectedColor';
		this.instance.show();
	}
	/**
	 * Updates the text content & color of the status bar item.
	 *
	 */
	update(color: string) {
		this.instance.text = color;
		this.instance.color = color;
	}
}
