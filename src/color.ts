import * as vscode from 'vscode';

import { showNotification } from './extension';

export class ColorProvider implements vscode.WebviewViewProvider {
	private _view?: vscode.WebviewView;
	private selectedColor: any;

	constructor(private readonly _extensionUri: vscode.Uri) {}

	public resolveWebviewView(webviewView: vscode.WebviewView) {
		this._view = webviewView;

		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [this._extensionUri],
		};

		webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

		webviewView.webview.onDidReceiveMessage((data) => {
			if (data.type == 'updateSelectedColor') {
				this.selectedColor = data.value;
			}
		});
	}

	public copySelectedColor() {
		vscode.env.clipboard.writeText(this.selectedColor);
		showNotification('copied ' + this.selectedColor);
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const main = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
		);

		const colorWheel = webview.asWebviewUri(
			vscode.Uri.joinPath(this._extensionUri, 'media', 'lib', 'reinvented-color-wheel.min.js')
		);
		const styleColorWheel = webview.asWebviewUri(
			vscode.Uri.joinPath(
				this._extensionUri,
				'media',
				'lib',
				'reinvented-color-wheel.min.css'
			)
		);

		const nonce = getNonce();

		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<!--
					Use a content security policy to only allow loading images from https or from our extension directory,
					and only allow scripts that have a specific nonce.
				-->
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				
				<link href="${styleColorWheel}" rel="stylesheet">

			</head>
			<body>
				<div id="color-wheel-container"></div>

				<script nonce="${nonce}" src="${colorWheel}"></script>
				<script nonce="${nonce}" src="${main}"></script>
			</body>
			</html>`;
	}
}

function getNonce() {
	let text = '';
	const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	for (let i = 0; i < 32; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
}

// <link href="${styleResetUri}" rel="stylesheet">
// <link href="${styleVSCodeUri}" rel="stylesheet">
// <link href="${styleMainUri}" rel="stylesheet">
