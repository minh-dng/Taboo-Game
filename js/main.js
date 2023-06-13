// Data from https://github.com/Kovah/Taboo-Data
'use strict';

async function fetchCategories() {
	const response = await fetch('./assets/json/Taboo-Data-main/src/data/categories.json');
	return response.json();
}

function displayDeckOptions(langChoice, tabooCategories) {
	const parent = document.querySelector('[name="deck"] ul');
	let toInject = `<li><label><input type="checkbox" name="all">${langChoice === 'en' ? 'All' : 'Alle'}</label></li>`;

	for (const [key, value] of Object.entries(tabooCategories[langChoice])) {
		toInject += `<li><label><input type="checkbox" name="${key}">${value.text}</label></li>`;
	}

	parent.innerHTML = toInject;
	selectDeckOption();
}

function selectDeckOption() {
	const parent = document.querySelector('[name="deck"] ul');
	const tickAllCheckbox = parent.querySelector('input[name="all"]');
	const normalCheckboxNodes = parent.querySelectorAll('input:not([name = "all"])');

	tickAllCheckbox.addEventListener('change', () => {
		normalCheckboxNodes.forEach(node => node.checked = tickAllCheckbox.checked);
	});

	normalCheckboxNodes.forEach(node => node.addEventListener('change', () => {
		const checkedCheckboxNodes = parent.querySelectorAll('input:not([name = "all"]):checked');
		tickAllCheckbox.checked = normalCheckboxNodes.length === checkedCheckboxNodes.length;
	}));

	return parent.querySelectorAll('input:not([name = "all"]):checked');
}

function startGame(deckChoiceNodes, tabooCategories, langChoice, teamNodes) {
	// Default team name is "Team 1" or "Team 2"
	let [team1Name, team2Name] = [...teamNodes].map(
		node => node.value.trim() === '' ? node.placeholder : node.value
	);

	localStorage.setItem('teams', JSON.stringify({
		'one': {
			'name': team1Name,
			'points': 0,
			'skip': {},
			'success': {},
			'buzz': {},
		},
		'two': {
			'name': team2Name,
			'points': 0,
			'skip': {},
			'success': {},
			'buzz': {},
		},
	}));

	localStorage.setItem('setUp', JSON.stringify({
		'langChoice': langChoice,
		'categories': Object.keys(tabooCategories[langChoice]),
		'deckChoices': [...deckChoiceNodes].map(node => node.name),
		'winPoints': 15, // Have an option for this
		'timerDuration': 30, // Have an option for this
	}));

	location.href = '/html/game.html';
}

function globalEvents(tabooCategories) {
	document.getElementById('language').addEventListener('change',
		() => displayDeckOptions(document.getElementById('language').value, tabooCategories)
	);

	document.getElementById('setupForm').addEventListener('submit', (event) => {
		event.preventDefault();

		startGame(
			selectDeckOption(),
			tabooCategories,
			document.getElementById('language').value,
			document.querySelectorAll('[data-group="teams"]')
		);
		return false;
	});
}

async function main() {
	localStorage.clear();

	const tabooCategories = await fetchCategories();
	displayDeckOptions('en', tabooCategories);
	globalEvents(tabooCategories);
}

main();