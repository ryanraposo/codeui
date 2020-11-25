/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

(function () {
	// TODO: webview state persist
	// const vscode = acquireVsCodeApi();
	// const oldState = vscode.getState() || { colors: [] };

	var colorWheel = new ReinventedColorWheel({
		appendTo: document.getElementById('color-wheel-container'),

		hex: '#888888',
		wheelDiameter: 200,
		wheelThickness: 20,
		handleDiameter: 16,
		wheelReflectsSaturation: true,

		onChange: function (color) {
			// TODO: webview on change color
			console.log('hsv:', color.hsv[0], color.hsv[1], color.hsv[2]);
		},
	});
})();
