'use strict';

// Note: The timer will slow down because of browser limiting setTimeout when tab becomes inactive
// No solution found at the moment 2023/04/19

function localStorageCheck() {
	// Incase empty localStorage in basic way.
	const requiredLocalStorageKey = ['teams', 'setUp'];
	for (let i = 0; i < requiredLocalStorageKey.length; i += 1) {
		if (localStorage.getItem(requiredLocalStorageKey[i]) == null) {
			throw new Error('localStorage not valid!');
		}
	}
}

async function getDeck(deckLocation) {
	const response = await fetch(`/assets/json/Taboo-Data-main/src/data/${deckLocation}`);
	return response.json();
}

function checkEndGame(teamOnePoints, teamTwoPoints, unusedCards) {
	const winPoints = JSON.parse(localStorage.getItem('setUp')).winPoints;

	if (Object.keys(unusedCards).length === 0
		|| teamOnePoints >= winPoints
		|| teamTwoPoints >= winPoints) {
		['setUp', 'unusedCards', 'currentCard', 'currentTeam'].forEach(
			i => localStorage.removeItem(i)
		);
		throw new Error('Game Finished');
	}
}

async function loadUnusedCards(deckChoices, tabooCategories, langChoice, unusedCards) {
	if (unusedCards === null) {
		unusedCards = {};
		// Get random category from the language selected
		if (deckChoices.length === 0) {
			deckChoices.push(tabooCategories[Math.floor(Math.random() * tabooCategories.length)]);
		}

		for (let i = 0; i < deckChoices.length; i += 1) {
			let cardsData = await getDeck(`${langChoice}/${deckChoices[i]}.json`);
			Object.assign(unusedCards, cardsData);
		}
	}

	return unusedCards;
}

function loadTeam(currentTeam, teams = JSON.parse(localStorage.getItem('teams'))) {
	// swap current team when parameter undefined (in the timer section)
	if (currentTeam === undefined) {
		currentTeam = JSON.parse(localStorage.getItem('currentTeam'));
		currentTeam = currentTeam === 'one' ? 'two' : 'one';
	}
	localStorage.setItem('currentTeam', JSON.stringify(currentTeam));

	const nextTeam = currentTeam === 'one' ? 'two' : 'one';

	// WARN: innerHTML risk
	document.getElementById(`team-${currentTeam}-label`).innerHTML = `<ins>${teams[currentTeam].name}</ins>`;
	document.getElementById(`team-${nextTeam}-label`).innerText = teams[nextTeam].name;

	document.getElementById(`team-${currentTeam}-points`).innerHTML = `<strong>${teams[currentTeam].points}</strong>`;
	document.getElementById(`team-${nextTeam}-points`).innerText = teams[nextTeam].points;
}

const countDownTimer = {
	set setTime(seconds) {
		if (seconds !== undefined) {
			this.requestedDuration = seconds;
			this.duration = seconds;
		}
	},
	requestedDuration: null,
	duration: null,
	pausedDuration: null,

	set setDisplayStatus(el) {
		this.displayStatus = el;
	},
	displayStatus: null,

	set setDisplayCount(el) {
		this.displayCount = el;
	},
	displayCount: null,

	set setButtons(el) {
		this.buttons = el;
	},
	buttons: null,

	running: false,
	start() {
		if (this.running) {
			this.pause();
			return;
		}
		this.running = true;
		this.buttons.forEach(button => button.disabled = false);
		let begin = Date.now();
		const that = this;

		// IIFE
		(function interval() {
			if (that.pausedDuration === null) {
				that.duration = that.requestedDuration - (((Date.now() - begin) / 1000) | 0);
			} else {
				that.duration = that.pausedDuration - (((Date.now() - begin) / 1000) | 0);
			}

			that.display();

			if (that.duration >= 0) {
				that.timerTimeout = setTimeout(interval, 1000);
			} else {
				that.timeout();
			}
		})();
	},
	cancelTimeout(pausing) {
		clearTimeout(this.timerTimeout);
		this.running = false;
		this.pausedDuration = pausing ? this.duration : null;
	},
	pause() {
		this.cancelTimeout(true);
		this.display();
		this.buttons.forEach(button => button.disabled = true);
	},
	display() {
		try {
			this.displayStatus.textContent = this.running ? '▶️' : '⏸️';
			this.displayCount.textContent = this.duration;
		} catch (e) {
			return;
		}
	},
	timeout() {
		this.cancelTimeout(false);

		action(
			document.querySelector('#container-team ins').closest('hgroup').getAttribute('data-team'),
			'skip',
			JSON.parse(localStorage.getItem('currentCard'))
		);
		// Switch team
		loadTeam();

		this.duration = this.requestedDuration;
		this.start();
	},
};

function loadTime(time) {
	countDownTimer.setDisplayStatus = document.getElementById('timer-status');
	countDownTimer.setDisplayCount = document.getElementById('timer-count');
	countDownTimer.setButtons = document.querySelectorAll("#action button");
	countDownTimer.setTime = time;
	countDownTimer.start();
}

function loadCard(unusedCards) {
	const randomProperty = obj => {
		const keys = Object.keys(obj);
		const tabooGuess = keys[Math.floor(Math.random() * keys.length)];
		const tabooPrompts = obj[tabooGuess];
		return [tabooGuess, tabooPrompts];
	};
	const tabooCard = randomProperty(unusedCards);

	document.getElementById('card-guess').textContent = tabooCard[0];

	let toInject = '';
	tabooCard[1].forEach(prompt => {
		toInject += `${prompt} <br>`;
	});

	document.getElementById('card-prompt').innerHTML = toInject;

	// Load card remaining counters
	document.getElementById('card-left').innerText = Object.keys(unusedCards).length;

	return { [tabooCard[0]]: tabooCard[1] };
}

function action(currentTeam, actionType, currentCard) {
	const teams = JSON.parse(localStorage.getItem('teams'));
	switch (actionType) {
		case 'next':
			teams[currentTeam].points += 1;
			Object.assign(teams[currentTeam].success, currentCard);
			break;
		case 'skip':
			Object.assign(teams[currentTeam].skip, currentCard);
			break;
		case 'buzz':
			teams[currentTeam].points -= Number(teams[currentTeam].points > 0);
			Object.assign(teams[currentTeam].buzz, currentCard);
			break;
	}
	const unusedCards = JSON.parse(localStorage.getItem('unusedCards'));
	delete unusedCards[Object.keys(currentCard)];

	localStorage.setItem('unusedCards', JSON.stringify(unusedCards));
	localStorage.setItem('teams', JSON.stringify(teams));

	loadTeam(currentTeam, teams);

	try {
		checkEndGame(teams.one.points, teams.two.points, unusedCards);
	} catch (e) {
		location.href = '/html/summary.html';
		return;
	}

	currentCard = JSON.stringify(loadCard(unusedCards));
	localStorage.setItem('currentCard', currentCard);
}

function globalEvents() {
	document.getElementById('button-timer').addEventListener('click', () => loadTime());

	const buttonAction = event => {
		action(
			document.querySelector('#container-team ins').closest('hgroup').getAttribute('data-team'),
			event.target.getAttribute('data-button'),
			JSON.parse(localStorage.getItem('currentCard'))
		);
	};

	document.getElementById('button-next').addEventListener('click', buttonAction);
	document.getElementById('button-skip').addEventListener('click', buttonAction);
	document.getElementById('button-buzz').addEventListener('click', buttonAction);

	document.addEventListener('keydown', event => {
		// using fall-through
		switch (event.key) {
			case 'ArrowRight':
			case 'Enter':
				document.getElementById('button-next').click();
				break;
			case 'ArrowUp':
			case 'Shift':
				document.getElementById('button-skip').click();
				break;
			case 'ArrowLeft':
			case ' ':
				document.getElementById('button-buzz').click();
				break;
			case 'Backspace':
			case 'Escape':
				document.getElementById('button-timer').click();
				break;
		}
	});
}

async function main() {
	try {
		localStorageCheck();
	} catch (e) {
		location.href = '/';
		return;
	}

	const teams = JSON.parse(localStorage.getItem('teams'));
	const unusedCards = await loadUnusedCards(
		JSON.parse(localStorage.getItem('setUp')).deckChoices,
		JSON.parse(localStorage.getItem('setUp')).categories,
		JSON.parse(localStorage.getItem('setUp')).langChoice,
		JSON.parse(localStorage.getItem('unusedCards'))
	);
	const currentTeam = JSON.parse(localStorage.getItem('currentTeam')) || 'one';
	const timerDuration = JSON.parse(localStorage.getItem('setUp')).timerDuration;
	const currentCard = loadCard(unusedCards);

	try {
		checkEndGame(teams.one.points, teams.two.points, unusedCards);
	} catch (e) {
		location.href = '/html/summary.html';
		return;
	}

	// Save last team before refresh
	loadTeam(currentTeam, teams);
	localStorage.setItem('unusedCards', JSON.stringify(unusedCards));
	localStorage.setItem('currentCard', JSON.stringify(currentCard));

	loadTime(timerDuration);
	globalEvents();
}

main();