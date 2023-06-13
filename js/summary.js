'use strict';
function localStorageCheck(teams) {
	if (teams !== null && Object.keys(teams).length === 2) {
		for (const value of Object.values(teams)) {
			['buzz', 'name', 'points', 'skip', 'success'].forEach(
				i => {
					if (value[i] === undefined) {
						throw new Error('localStorage missing team data');
					}
				});
		}
		return;
	}

	throw new Error('localStorage either null or doesn\'t have 2 teams');
}

function displayTeamSummary(teams) {
	if (teams.one.points > teams.two.points) {
		document.getElementById('team-one-label').innerHTML = `<ins>🏆 ${teams.one.name}</ins>`;
		document.getElementById('team-two-label').innerHTML = teams.two.name;
	} else if (teams.one.points < teams.two.points) {
		document.getElementById('team-one-label').innerHTML = teams.one.name;
		document.getElementById('team-two-label').innerHTML = `<ins>🏆 ${teams.two.name}</ins>`;
	} else {
		document.getElementById('team-one-label').innerHTML = `🎌${teams.one.name}`;
		document.getElementById('team-two-label').innerHTML = `🎌${teams.two.name}`;
	}

	['one', 'two'].forEach(
		team => {
			document.querySelector(`#team-${team}-points > span`).textContent = teams[team].points;
			// 3 detail boxes
			['success', 'skip', 'buzz'].forEach(
				cardResult => {
					const cardResultObject = teams[team][cardResult];

					document.querySelector(`#team-${team}-${cardResult} > summary > span`)
						.textContent = Object.keys(cardResultObject).length;

					let contentSummary = '';
					for (const [key, value] of Object.entries(cardResultObject)) {
						contentSummary += `<li>${key} — ${value.join(', ')}</li>`;
					}

					document.querySelector(`#team-${team}-${cardResult} > ul`).innerHTML = contentSummary;
				}
			);
		}
	);
}

function main() {
	const teams = JSON.parse(localStorage.getItem('teams'));
	try {
		localStorageCheck(teams);
	} catch (e) {
		location.href = '/';
		return;
	}

	displayTeamSummary(teams);
}

main();