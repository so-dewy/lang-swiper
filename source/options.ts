// eslint-disable-next-line import/no-unassigned-import
import 'webext-base-css';
import './options.css';

import optionsStorage from './options-storage.js';

const rangeInputs = [...document.querySelectorAll('input[type="range"][name^="fontSize"]')] as HTMLInputElement[];
const numberInputs = [...document.querySelectorAll('input[type="number"][name^="fontSize"]')] as HTMLInputElement[];
const output = document.querySelector('.fontsize-output') as HTMLElement;

function updateFontSize() {
	output.style.fontSize = `${rangeInputs[0].value}px`;
}

function updateInputField(event) {
	numberInputs[rangeInputs.indexOf(event.currentTarget)].value = event.currentTarget.value;
}

for (const input of rangeInputs) {
	input.addEventListener('input', updateFontSize);
	input.addEventListener('input', updateInputField);
}

async function init() {
	await optionsStorage.syncForm('#options-form');
	updateFontSize();
}

init();
