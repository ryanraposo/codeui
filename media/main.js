/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

(function () {
	const vscode = acquireVsCodeApi();

	const initialColor = '#3fdaa4';

	var currentState = vscode.getState() || { color: initialColor };

	function updateSelectedColor(color) {
		vscode.postMessage({ type: 'updateSelectedColor', value: color });
	}

	function saveState(state) {
		vscode.setState({ color: state.color });
		currentState = state;
		updateSelectedColor(state.color);
	}

	var colorWheel = new ReinventedColorWheel({
		appendTo: document.getElementById('color-wheel-container'),

		hex: currentState.selectedColor,
		wheelDiameter: 200,
		wheelThickness: 20,
		handleDiameter: 16,
		wheelReflectsSaturation: true,

		onChange: function (color) {
			saveState({ color: color.hex });
		},
	});
	saveState({ color: colorWheel.hex });
})();
