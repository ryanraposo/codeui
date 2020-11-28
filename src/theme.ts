import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as jsonc from 'jsonc-parser';

import { getConfig } from './configuration';

export function getCurrentColorTheme(): ColorTheme {
	const config = getConfig();
	const themeName = <string>config.getColorThemeName();
	return new ColorTheme(themeName);
}

export class ColorTheme {
	private themePath: any;
	private themeObject: any;
	name: string;

	constructor(colorThemeName: string) {
		this.name = colorThemeName;
		this.themePath = this.getThemePath(colorThemeName);
		this.themeObject = this.getThemeObject(this.themePath);
	}

	private getThemePath(userSettingsTheme: any): any {
		try {
			for (const extension of vscode.extensions.all) {
				const contributions: any = extension.packageJSON['contributes'];
				if (contributions) {
					if (contributions['themes']) {
						for (const theme of contributions['themes']) {
							if (theme['label'] === userSettingsTheme) {
								return path.join(extension.extensionPath, theme['path']);
							}
						}
					}
				}
			}
		} catch {
			return undefined;
		}
	}

	private getThemeObject(themePath: any): any {
		let text = '';
		if (themePath) {
			text = fs.readFileSync(themePath, 'utf8');
			const jsonObject = jsonc.parse(text);
			return jsonObject;
		}
	}

	get workbenchColorCustomizations(): any {
		if (!this.themeObject) {
			return undefined;
		}
		const workbenchCustomizations = this.themeObject.colors;
		return workbenchCustomizations;
	}

	get type() {
		try {
			return this.themeObject['type'];
		} catch {
			return '-';
		}
	}

	get author() {
		try {
			return this.themeObject['author'];
		} catch {
			return '-';
		}
	}
}
