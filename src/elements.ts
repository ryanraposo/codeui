'use strict';

import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import tinycolor from '@ctrl/tinycolor';

import { chooseScope, showNotification, getInfoProvider } from './extension';
import * as theme from './theme';
import * as configuration from './configuration';

interface ColorConfig {
	[index: number]: string;
	default: string | undefined;
	theme: string | undefined;
	settings: {
		global: string | undefined;
		workspace: string | undefined;
	};
}

export enum ViewMode {
	standard = 0,
	palette = 1,
}

interface WorkbenchCustomizations {
	[key: string]: any;
}

export class ElementProvider implements vscode.TreeDataProvider<any> {
	private _onDidChangeTreeData: vscode.EventEmitter<any> = new vscode.EventEmitter<any>();
	readonly onDidChangeTreeData: vscode.Event<any> = this._onDidChangeTreeData.event;

	viewMode: ViewMode;

	colors: any;
	elementData: any = [];
	colorConfigs: any;
	elementItems: any = [];

	constructor(viewMode: ViewMode) {
		this.viewMode = viewMode;
		this.loadElementData();
		this.loadColors();
		this.loadColorConfigs();

		for (const key in this.elementData) {
			const elementData = this.elementData[key];
			const treeItem = new Element(
				elementData,
				vscode.TreeItemCollapsibleState.None,
				this.viewMode,
				this
			);
			this.elementItems[elementData.fullName] = treeItem;
		}
	}

	refresh(element?: any): void {
		this.loadColorConfigs();

		if (element) {
			element.update();
			this._onDidChangeTreeData.fire(element);
		} else {
			for (const key in this.elementItems) {
				this.elementItems[key].update();
			}
			this._onDidChangeTreeData.fire(null);
		}
	}

	getTreeItem(element: Element): vscode.TreeItem {
		return element;
	}

	getChildren(elementTreeGroup?: any): any {
		const children: any = [];

		if (this.viewMode === ViewMode.standard) {
			if (elementTreeGroup) {
				for (const key in this.elementItems) {
					const value = this.elementItems[key];
					if (value.elementData.group === elementTreeGroup.label) {
						children.push(value);
					}
				}
				return children;
			} else {
				return this.getStandardViewGroups();
			}
		}

		if (this.viewMode === ViewMode.palette) {
			if (elementTreeGroup) {
				return elementTreeGroup.children;
			} else {
				return this.getPaletteViewGroups();
			}
		}
	}

	private getUserColors() {
		this.colors = {};
		const userColors: any = vscode.workspace
			.getConfiguration()
			.get('codeui.favoriteColors');
		if (userColors) {
			for (const key in userColors) {
				const value = userColors[key];
				if (isHexidecimal(value)) {
					this.colors[value] = '$(star)  ' + key;
				} else {
					showNotification(
						"user-defined color '" +
							key +
							':' +
							value +
							' is not valid. Refer to the configuration tooltip'
					);
				}
			}
		}
	}

	private loadColors(): any {
		this.getUserColors();

		const presetColorsText = fs.readFileSync(
			path.join(__filename, '..', '..', 'data', 'colors.json'),
			'utf8'
		);
		const presetColors = JSON.parse(presetColorsText);
		for (const key in presetColors) {
			const value = presetColors[key];
			if (!this.colors[key]) {
				this.colors[key] = value;
			}
		}
	}

	private loadElementData(): any {
		const fileText: string = fs.readFileSync(
			path.join(__filename, '..', '..', 'data', 'vscodeElementsArray.json'),
			'utf8'
		);
		const allElementsObject = JSON.parse(fileText);
		for (const key in allElementsObject) {
			const value = allElementsObject[key];
			this.elementData[value.fullName] = value;
		}
	}

	private loadColorConfigs(): any {
		const elementNames: string[] = [];
		for (const key in this.elementData) {
			const value = this.elementData[key];
			elementNames.push(value.fullName);
		}
		const defaultConfigs = getDefaultConfigs();
		const themeConfigs = getThemeConfigs();
		const settingsConfigs = getSettingsConfigs();

		this.colorConfigs = appendConfigs(
			elementNames,
			defaultConfigs,
			themeConfigs,
			settingsConfigs
		);

		function appendConfigs(
			elementNames: string[],
			defaultConfigs: any,
			themeConfigs: any,
			settingsConfigs: any
		): any {
			const colorConfigurations: any = {};

			const currentThemeName: string = configuration.getEffectiveColorThemeName();

			for (const key in elementNames) {
				const element: string = elementNames[key];
				const elementColorConfig: ColorConfig = {
					default: undefined,
					theme: undefined,
					settings: {
						global: undefined,
						workspace: undefined,
					},
				};

				elementColorConfig.default = defaultConfigs[element];

				if (themeConfigs) {
					elementColorConfig.theme = themeConfigs[element];
				}

				if (settingsConfigs) {
					if (settingsConfigs.globalValue) {
						elementColorConfig.settings.global =
							settingsConfigs.globalValue[element];
						// resolve theme-specific value
						if (settingsConfigs.globalValue['[' + currentThemeName + ']']) {
							const themeSpecificCustomizations =
								settingsConfigs.globalValue['[' + currentThemeName + ']'];
							if (themeSpecificCustomizations[element]) {
								elementColorConfig.settings.global =
									themeSpecificCustomizations[element];
							}
						}
						// resolve theme-specific value
					}
					if (settingsConfigs.workspaceValue) {
						elementColorConfig.settings.workspace =
							settingsConfigs.workspaceValue[element];
						// resolve theme-specific value
						if (settingsConfigs.workspaceValue['[' + currentThemeName + ']']) {
							const themeSpecificCustomizations =
								settingsConfigs.workspaceValue[
									'[' + currentThemeName + ']'
								];
							if (themeSpecificCustomizations[element]) {
								elementColorConfig.settings.workspace =
									themeSpecificCustomizations[element];
							}
						}
						// resolve theme-specific value
					}
				}

				colorConfigurations[element] = elementColorConfig;
			}

			return colorConfigurations;
		}

		function getDefaultConfigs() {
			const fileText: string = fs.readFileSync(
				path.join(__filename, '..', '..', 'data', 'defaultColors_dark.json'),
				'utf8'
			);
			const defaultColorsObject = JSON.parse(fileText);

			return defaultColorsObject;
		}

		function getThemeConfigs() {
			const currentTheme = theme.getCurrentColorTheme();
			const workbenchCustomizations = currentTheme.workbenchColorCustomizations;

			if (workbenchCustomizations) {
				return workbenchCustomizations;
			} else {
				return {};
			}
		}

		function getSettingsConfigs() {
			const configurations: vscode.WorkspaceConfiguration = vscode.workspace.getConfiguration();
			const workbenchColorCustomizations = configurations.inspect(
				'workbench.colorCustomizations'
			);

			if (workbenchColorCustomizations) {
				return workbenchColorCustomizations;
			} else {
				return {};
			}
		}
	}

	public getStandardViewGroups(): ElementTreeGroup[] {
		const elementGroupNames = [];
		const elementTreeGroups: any = [];

		for (const key in this.elementItems) {
			const group = this.elementItems[key].elementData.group;
			if (elementGroupNames.indexOf(group) < 0) {
				elementGroupNames.push(group);
				elementTreeGroups.push(
					new ElementTreeGroup(
						group,
						vscode.TreeItemCollapsibleState.Collapsed,
						undefined,
						'',
						ViewMode.standard
					)
				);
			}
		}

		return elementTreeGroups;
	}

	public getPaletteViewGroups(): ElementTreeGroup[] {
		const elementColors = [];
		let elementTreeGroups = [];

		const colorCount: any = [];

		for (const key in this.elementItems) {
			const value = this.elementItems[key].colorConfig;
			let effectiveColor = getEffectiveColor(value);
			if (effectiveColor) {
				effectiveColor = effectiveColor.toLowerCase();
			}
			if (elementColors.indexOf(effectiveColor) < 0) {
				elementColors.push(effectiveColor);
				let label = effectiveColor;
				if (!label) {
					label = '(unset)';
				}
				const elementTreeGroup = new ElementTreeGroup(
					label,
					vscode.TreeItemCollapsibleState.Collapsed,
					effectiveColor,
					'',
					ViewMode.palette
				);
				elementTreeGroup.addChild(this.elementItems[key]);
				elementTreeGroups.push(elementTreeGroup);
			} else {
				elementTreeGroups.find((treeGroup) => {
					if (treeGroup.label === effectiveColor) {
						treeGroup.addChild(this.elementItems[key]);
					}
				});
			}
		}

		elementTreeGroups = elementTreeGroups.sort((e1, e2) => {
			if (e1.children.length > e2.children.length) {
				return -1;
			} else {
				return 1;
			}
		});

		return elementTreeGroups;
	}

	public customize(item: Element | ElementTreeGroup) {
		const targetElements: Array<any> = [];
		const colorItems: Array<vscode.QuickPickItem> = [];
		const customizations: WorkbenchCustomizations = {};
		let userColor: string | undefined;

		// Get preset quickpickItems (colors)
		for (const key in this.colors) {
			const value = this.colors[key];
			colorItems.push({ label: value, description: key });
		}

		// Parse selected element(s) & if element, pass to InfoProvider
		const infoProvider = getInfoProvider();
		if (item instanceof Element) {
			targetElements.push(item.elementData.fullName);
			infoProvider.updateSelectedElement(item);
		}
		if (item instanceof ElementTreeGroup) {
			for (const child of item.children) {
				targetElements.push(child.elementData.fullName);
			}
		}

		// Get customization value from user
		vscode.window
			.showQuickPick([{ label: 'Enter a value...' }, { label: 'Choose a preset...' }])
			.then((selection) => {
				if (selection) {
					if (selection.label === 'Enter a value...') {
						vscode.window
							.showInputBox({ placeHolder: 'eg. #f2f2f2' })
							.then((selectedColor) => {
								if (selectedColor) {
									userColor = selectedColor;
									apply(); // Write the customization to settings
								}
							});
					}
					if (selection.label === 'Choose a preset...') {
						vscode.window
							.showQuickPick(colorItems, { canPickMany: false })
							.then((selectedColor) => {
								if (selectedColor) {
									userColor = selectedColor.description;
									apply(); // Write the customization to settings
								}
							});
					}
				}
			});

		function apply() {
			for (const element of targetElements) {
				customizations[element] = userColor;
			}
			ElementProvider.updateWorkbenchColors(customizations);
		}
	}

	public async adjustBrightness(item: Element | ElementTreeGroup) {
		if (item instanceof Element) {
			const infoProvider = getInfoProvider();
			infoProvider.updateSelectedElement(item);
		}

		const darken10 = 'Darken (10%)';
		const lighten10 = 'Lighten (10%)';
		const darkenCustom = 'Darken (Custom value)';
		const lightenCustom = 'Lighten (Custom value)';
		const actionSelection = await vscode.window.showQuickPick([
			darken10,
			lighten10,
			darkenCustom,
			lightenCustom,
		]);
		if (!actionSelection) {
			return;
		}
		if (actionSelection === lighten10) {
			lighten(item);
		} else if (actionSelection === darken10) {
			darken(item);
		} else if (actionSelection === lightenCustom) {
			const lightenCustomValueNumber = await showPercentInput();
			if (!lightenCustomValueNumber) {
				return;
			}
			lighten(item, lightenCustomValueNumber);
		} else if (actionSelection === darkenCustom) {
			const darkenCustomValueNumber = await showPercentInput();
			if (!darkenCustomValueNumber) {
				return;
			}
			darken(item, darkenCustomValueNumber);
		}

		async function showPercentInput(): Promise<number | undefined> {
			const percentString = await vscode.window.showInputBox({
				prompt: 'Enter a number (Percent)',
				validateInput(input: string) {
					const percentNumber = parseFloat(input);
					if (!isNaN(percentNumber) && isFinite(percentNumber)) {
						return '';
					}
					return 'Value is not a valid number.';
				},
			});
			if (percentString) {
				return parseFloat(percentString);
			}
		}

		function darken(item: Element | ElementTreeGroup, value = 5) {
			const customizations: WorkbenchCustomizations = {};

			if (item instanceof Element) {
				const darkenedValue =
					'#' +
					tinycolor(getEffectiveColor(item.colorConfig)).darken(value).toHex();
				customizations[item.elementData.fullName] = darkenedValue;
			}

			if (item instanceof ElementTreeGroup) {
				for (const key in item.children) {
					const value = item.children[key];
					const darkenedValue =
						'#' +
						tinycolor(getEffectiveColor(value.colorConfig))
							.darken(value)
							.toHex();
					customizations[value.elementData.fullName] = darkenedValue;
				}
			}

			ElementProvider.updateWorkbenchColors(customizations);
		}

		function lighten(item: Element | ElementTreeGroup, value = 5) {
			const customizations: WorkbenchCustomizations = {};

			if (item instanceof Element) {
				const lightenedValue =
					'#' +
					tinycolor(getEffectiveColor(item.colorConfig)).lighten(value).toHex();
				customizations[item.elementData.fullName] = lightenedValue;
			}

			if (item instanceof ElementTreeGroup) {
				for (const key in item.children) {
					const value = item.children[key];
					const lightenedValue =
						'#' +
						tinycolor(getEffectiveColor(value.colorConfig))
							.lighten(value)
							.toHex();
					customizations[value.elementData.fullName] = lightenedValue;
				}
			}

			ElementProvider.updateWorkbenchColors(customizations);
		}
	}

	public clear(item: Element | ElementTreeGroup) {
		if (item instanceof Element) {
			const infoProvider = getInfoProvider();
			infoProvider.updateSelectedElement(item);
			const elementName: string = item.elementData.fullName;
			ElementProvider.updateWorkbenchColors({ [elementName]: undefined });
		} else {
			const customizations: any = {};
			for (const element of item.children) {
				customizations[element.elementData.fullName] = undefined;
				ElementProvider.updateWorkbenchColors(customizations);
			}
		}
	}

	public copy(item: Element): void {
		if (typeof item.description === 'string') {
			vscode.env.clipboard.writeText(item.description);
			showNotification('copied ' + item.description);
		}
	}

	static async updateWorkbenchColors(customizations: WorkbenchCustomizations) {
		const currentThemeProp = '[' + configuration.getEffectiveColorThemeName() + ']';

		const target = await resolveTarget();
		let scopedCustomizations: any = {};

		if (target === vscode.ConfigurationTarget.Global) {
			scopedCustomizations = await configuration.getGlobalWorkbenchColorCustomizations();
		}
		if (target === vscode.ConfigurationTarget.Workspace) {
			scopedCustomizations = await configuration.getWorkspaceWorkbenchColorCustomizations();
		}

		for (const element in customizations) {
			// for key(element name) in supplied array
			const value = customizations[element]; // value = color value
			if ((await isHexidecimal(value)) || value === undefined) {
				const targetingMode = configuration.getTargetingMode();
				if (targetingMode === 'themeSpecific') {
					if (scopedCustomizations[currentThemeProp]) {
						scopedCustomizations[currentThemeProp][element] = value;
					} else {
						scopedCustomizations[currentThemeProp] = {};
						scopedCustomizations[currentThemeProp][element] = value;
					}
				} else {
					scopedCustomizations[element] = value;
				}
			} else {
				await showNotification(value + 'is not a valid hex color!');
				return;
			}
		}

		await vscode.workspace
			.getConfiguration()
			.update('workbench.colorCustomizations', scopedCustomizations, target);
	}
}

export class Element extends vscode.TreeItem {
	viewMode: any;
	elementData: any;
	colorConfig: any;
	dataProvider: any;

	constructor(
		elementData: any,
		collapsibleState: vscode.TreeItemCollapsibleState,
		viewMode: ViewMode,
		dataProvider: vscode.TreeDataProvider<any>
	) {
		super('', collapsibleState);
		this.elementData = elementData;

		this.tooltip = elementData.info;
		this.command = {
			title: '',
			command: 'showElementInfo',
			arguments: [this],
		};

		if (viewMode === ViewMode.standard) {
			this.label = this.elementData.groupedName;
		}

		if (viewMode === ViewMode.palette) {
			this.label = this.elementData.titleName;
		}
		this.dataProvider = dataProvider;

		this.update();
	}

	private update(): void {
		this.colorConfig = this.dataProvider.colorConfigs[this.elementData.fullName];
		const effectiveColor = getEffectiveColor(this.colorConfig);
		if (effectiveColor) {
			this.description = effectiveColor.toLowerCase();
		} else {
			this.description = '-';
		}

		this.iconPath = this.generateIcon();
	}

	private generateIcon(): string {
		let iconPath = '';
		let svgText = '';

		let baseColor = '';
		let topColor = '';

		const colorConfig = this.colorConfig;

		// Decides the base color & top color, with only customizations appearing as topcoats

		if (colorConfig.settings.global && colorConfig.settings.workspace) {
			baseColor = colorConfig.settings.global;
			topColor = colorConfig.settings.workspace;
		} else {
			for (const item of [colorConfig.default, colorConfig.theme]) {
				if (item) {
					baseColor = item;
				}
			}
			for (const item of [
				colorConfig.settings.global,
				colorConfig.settings.workspace,
			]) {
				if (item) {
					topColor = item;
				}
			}
		}

		// Load template svg text
		svgText = fs.readFileSync(
			path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch.svg'),
			'utf8'
		);

		// Insert base color to svg text, change corresponding opacity to 1 from 0
		if (baseColor) {
			svgText = svgText.replace(
				'fill:%COLOR1%;fill-opacity:0',
				'fill:' + baseColor + ';fill-opacity:1'
			);
		}

		// Insert top color to svg text,, change corresponding opacity to 1 from 0
		if (topColor) {
			svgText = svgText.replace(
				'<path style="fill:%COLOR2%;stroke-width:0.83446652;fill-opacity:0',
				'<path style="fill:' + topColor + ';stroke-width:0.83446652;fill-opacity:1'
			);
		}

		// Write new svg text to a temp, generated svg file
		iconPath = path.join(
			__filename,
			'..',
			'..',
			'resources',
			'swatches',
			'generated',
			'generated_' + baseColor + '-' + topColor + '.svg'
		);
		fs.writeFileSync(iconPath, svgText);
		// Return the path
		return iconPath;
	}

	contextValue = 'element';
}

export class ElementTreeGroup extends vscode.TreeItem {
	size: any;
	children: any = [];
	color: any;

	constructor(
		label: string,
		collapsibleState: vscode.TreeItemCollapsibleState,
		color: any,
		tooltip: string,
		viewMode: ViewMode
	) {
		super(label, collapsibleState);
		this.label = label;
		this.color = color;
		if (color) {
			this.iconPath = this.getGeneratedIcon();
		}
		if (viewMode === ViewMode.palette) {
			this.contextValue = 'paletteGroup';
		}
		if (viewMode === ViewMode.standard) {
			this.contextValue = 'standardGroup';
		}
	}

	private getGeneratedIcon(): string {
		let iconPath = '';
		let svgText = '';
		let baseColor: any;
		// Load template svg text
		svgText = fs.readFileSync(
			path.join(__filename, '..', '..', 'resources', 'swatches', 'swatch.svg'),
			'utf8'
		);

		// Get & apply base color (if any)
		svgText = svgText.replace(
			'fill:%COLOR1%;fill-opacity:0',
			'fill:' + this.color + ';fill-opacity:1'
		);

		// Write new svg text to a temp, generated svg file
		iconPath = path.join(
			__filename,
			'..',
			'..',
			'resources',
			'swatches',
			'generated',
			'generated_' + this.color + '.svg'
		);
		fs.writeFileSync(iconPath, svgText);
		// Return the path
		return iconPath;
	}

	addChild(element: Element): void {
		this.children.push(element);
		this.description = this.children.length.toString();
	}
}

function getEffectiveColor(colorConfig: ColorConfig): string | undefined {
	let effective: string | undefined;

	for (const item of [
		colorConfig.default,
		colorConfig.theme,
		colorConfig.settings.global,
		colorConfig.settings.workspace,
	]) {
		if (item) {
			effective = item;
		}
	}

	return effective;
}

function resolveTarget(): any {
	const workspaceRootFolder = configuration.getWorkspaceRootFolder();
	const preferredScope = configuration.getPreferredScope();

	let target: any;

	if (workspaceRootFolder) {
		if (preferredScope === 'alwaysAsk') {
			target = chooseScope(workspaceRootFolder);
			if (!target) {
				return;
			}
		} else if (preferredScope === 'global') {
			target = vscode.ConfigurationTarget.Global;
		} else if (preferredScope === 'workspace') {
			target = target = vscode.ConfigurationTarget.Workspace;
		}
	} else if (!workspaceRootFolder) {
		target = vscode.ConfigurationTarget.Global;
	}

	return target;
}

function isHexidecimal(str: string) {
	const regexp = /^#[0-9a-fA-F]+$/;

	if (regexp.test(str)) {
		return true;
	} else {
		return false;
	}
}
