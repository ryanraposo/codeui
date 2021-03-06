import * as vscode from 'vscode';
import { Element } from './elements';

import * as theme from './theme';

export class InfoProvider implements vscode.TreeDataProvider<any> {
	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

	currentTheme: any;
	selectedElement: any;

	elementHeading: InfoItem | undefined;
	themeHeading: any;

	constructor() {
		this.updateTheme();
	}

	refresh(infoItem?: any) {
		if (infoItem) {
			this._onDidChangeTreeData.fire(infoItem);
		} else {
			this._onDidChangeTreeData.fire(null);
		}
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(infoItem?: InfoItem): vscode.TreeItem[] {
		let children: Array<InfoItem> = [];

		if (!infoItem) {
			// If root...
			children.push(this.getThemeItem());
			children.push(this.getSelectedElementItem());
		} else {
			if (infoItem.label === 'Theme') {
				// If theme section...
				children = this.getThemeChildren();
			}
			if (infoItem.label === 'Element') {
				// If element section...
				children = this.getSelectedElementChildren();
			}
		}

		return children;
	}

	updateSelectedElement(element: Element) {
		const selectedElement = element;
		this.selectedElement = selectedElement;
		this.refresh();
	}

	getSelectedElementItem(): InfoItem {
		if (!this.selectedElement) {
			return new InfoItem({
				label: 'Element',
				description: '-',
				collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
			});
		}
		const selectedElementHeading = new InfoItem({
			label: 'Element',
			description: this.selectedElement.elementData['titleName'],
			collapsibleState: vscode.TreeItemCollapsibleState.Expanded,
		});
		return selectedElementHeading;
	}

	getSelectedElementChildren(): Array<InfoItem> {
		if (!this.selectedElement) {
			return [];
		}

		const selectedElementChildren: Array<InfoItem> = [];

		selectedElementChildren.push(
			new InfoItem({
				label: 'Default',
				description: definitionToLowerCaseDescription(
					this.selectedElement.colorConfig.default
				),
				collapsibleState: vscode.TreeItemCollapsibleState.None,
			})
		);
		selectedElementChildren.push(
			new InfoItem({
				label: 'Theme',
				description: definitionToLowerCaseDescription(
					this.selectedElement.colorConfig.theme
				),
				collapsibleState: vscode.TreeItemCollapsibleState.None,
			})
		);
		selectedElementChildren.push(
			new InfoItem({
				label: 'Settings (global)',
				description: definitionToLowerCaseDescription(
					this.selectedElement.colorConfig.settings.global
				),
				collapsibleState: vscode.TreeItemCollapsibleState.None,
			})
		);
		selectedElementChildren.push(
			new InfoItem({
				label: 'Settings (workspace)',
				description: definitionToLowerCaseDescription(
					this.selectedElement.colorConfig.settings.workspace
				),
				collapsibleState: vscode.TreeItemCollapsibleState.None,
			})
		);

		return selectedElementChildren;
	}

	updateTheme() {
		const currentTheme = theme.getCurrentColorTheme();
		this.currentTheme = currentTheme;
	}

	getThemeItem(): InfoItem {
		if (!this.currentTheme) {
			return new InfoItem({
				label: 'Theme',
				description: '-',
				collapsibleState: vscode.TreeItemCollapsibleState.None,
			});
		}
		const themeHeading = new InfoItem({
			label: 'Theme',
			description: this.currentTheme.name,
			collapsibleState: vscode.TreeItemCollapsibleState.Collapsed,
		});
		return themeHeading;
	}

	getThemeChildren(): Array<InfoItem> {
		//Update description of theme header and return array of it's children

		if (!this.currentTheme) {
			return [];
		}

		const themeInfoChildren: Array<InfoItem> = [];

		themeInfoChildren.push(
			new InfoItem({
				label: 'Type',
				description: this.currentTheme.type,
				collapsibleState: vscode.TreeItemCollapsibleState.None,
			})
		);
		themeInfoChildren.push(
			new InfoItem({
				label: 'Author',
				description: this.currentTheme.author,
				collapsibleState: vscode.TreeItemCollapsibleState.None,
			})
		);

		return themeInfoChildren;
	}
}

class InfoItem extends vscode.TreeItem {
	iconPath: any;
	description: any;

	constructor({
		label,
		description,
		collapsibleState,
	}: {
		label: string;
		description: string;
		collapsibleState: vscode.TreeItemCollapsibleState;
	}) {
		super(label, collapsibleState);
		this.description = description;
	}
}

function definitionToLowerCaseDescription(value: any): string {
	if (value && typeof value === 'string') {
		return value.toLowerCase();
	} else {
		return '-';
	}
}
