// session.js
import { ELEMENTS, CARDS, local } from "../utilities/global.js";
import { getIndexes, isEmptyStr, cutString } from "../utilities/utilities.js";

export function setCards(userdata) {
	const { modules } = userdata;

	// Reset cards
	CARDS[1] = [];
	CARDS[2] = [];
	CARDS[3] = [];
	CARDS[4] = [];
	CARDS[5] = [];
	// Reset cards

	modules.forEach((module) => {
		module.units.forEach((unit) => {
			unit.cards.forEach((card) => {
				card.isActive = module.isActive && unit.isActive;
				card.moduleTitle = module.title;
				card.unitTitle = unit.title;
				card.moduleId = module.id;
				card.unitId = unit.id;
			});
		});
	});

	const cards = modules.flatMap((module) => {
		if (module.isActive) {
			return module.units.flatMap((unit) => (unit.isActive ? unit.cards : []));
		}
		return [];
	});

	cards.forEach((card) => {
		console.log(cards);
		if (!card) return;
		if (card.level > 5) {
			if (true) {
				card.level = 5;
				CARDS[5].push(card);
			}
		} else {
			CARDS[card.level].push(card);
		}
	});

	updateElCardLevels();
}

function getToDisplayCard() {
	for (let i of Object.keys(CARDS)) {
		if (CARDS[i].length !== 0) {
			return { card: CARDS[i][0], key: parseInt(i) };
		}
	}
	return { card: null, key: null };
}

function updateElCardLevels() {
	ELEMENTS.SESSION_LEVELS[0].innerText = CARDS[1].length;
	ELEMENTS.SESSION_LEVELS[1].innerText = CARDS[2].length;
	ELEMENTS.SESSION_LEVELS[2].innerText = CARDS[3].length;
	ELEMENTS.SESSION_LEVELS[3].innerText = CARDS[4].length;
	ELEMENTS.SESSION_LEVELS[4].innerText = CARDS[5].length;
}

export function renderElSession() {
	const { card, key } = getToDisplayCard();
	ELEMENTS.SESSION_CONTENTS.innerHTML = "";
	if (card !== null) {
		ELEMENTS.SESSION_CONTENTS.appendChild(getElSessCard(card, key));
	}
}

function setElSessCardListener(container, moduleId, unitId, cardId, key) {
	container.querySelector(".edit-button")?.addEventListener("click", async () => {
		const front = container.querySelector(".front");
		const back = container.querySelector(".back");

		if (isEmptyStr(front.innerText) || isEmptyStr(back.innerText)) {
			alert("Please finish editing");
		} else {
			const userdata = await local.get(null);

			const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
			userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].front = front.innerText;
			userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].back = back.innerText;

			userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].isEditing = false; // Storage change state

			// Temporary variable change state
			CARDS[key][0].isEditing = !CARDS[key][0].isEditing;
			CARDS[key][0].front = front.innerText;
			CARDS[key][0].back = back.innerText;

			await local.set(userdata);
		}
	});

	container.querySelector(".card-backward")?.addEventListener("click", async () => {
		if (CARDS[key].length === 0) return;
		if (CARDS[key][0].level === 1) return;

		CARDS[key][0].level -= 1;

		const userdata = await local.get(null);
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
		userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level = CARDS[key][0].level;
		await local.set(userdata);

		CARDS[key - 1].push(CARDS[key][0]); // Move the card to lower level
		CARDS[key].splice(0, 1); // Delete the card from its current level

		renderElSession();
		updateElCardLevels();
	});

	container.querySelector(".card-forward")?.addEventListener("click", async () => {
		if (CARDS[key].length === 0) return;

		CARDS[key][0].level += 1;

		const userdata = await local.get(null);
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
		userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level = CARDS[key][0].level; // Storage change state
		await local.set(userdata);

		if (CARDS[key][0].level > 5) {
			CARDS[key].splice(0, 1); // This card is done
		} else {
			// Temporay variable change state
			CARDS[key + 1].push(CARDS[key][0]); // Move the card to higher level
			CARDS[key].splice(0, 1); // Delete the card from its current level
		}

		renderElSession();
		updateElCardLevels();
	});

	container.querySelector(".edit-info").addEventListener("click", async () => {
		const userdata = await local.get(null);
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
		const isEditing = userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].isEditing;
		userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].isEditing = !isEditing; // Storage change state
		CARDS[key][0].isEditing = !CARDS[key][0].isEditing; // Temporary variable change state

		await local.set(userdata);
	});

	container.querySelector(".card-delete").addEventListener("click", async () => {
		const userdata = await local.get(null);
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
		userdata.modules[moduleIndex].units[unitIndex].cards.splice(cardIndex, 1); // Storage change state
		CARDS[key].splice(0, 1); // Temporary variable change state
		await local.set(userdata);

		updateElCardLevels();
	});
}

function getElSessCard(card, key) {
	const { id, type, card_type, level, isEditing, moduleId, unitId, moduleTitle, unitTitle } = card;

	const container = document.createElement("div");
	container.classList.add("card");
	container.dataset.id = id;

	switch (card_type) {
		case "flashcard":
			const { front, back } = card;
			container.classList.add("card-flashcard");

			// TO IMPLEMENT
			const isEditingInfo = isEmptyStr(front) || isEmptyStr(back) || isEditing;
			if (isEditingInfo) container.classList.add("session-card-edit");

			const cardAction = `
			<div class="card-flashcard-action">
					<button class="card-backward">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
					</button>
					<div class="line-vertical"></div>
					<button class="card-forward">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" /></svg>
					</button>
				</div>
			`;

			container.innerHTML = `				
				<p class="question-info">${cutString(moduleTitle)} > ${cutString(unitTitle)}</p>
				<p class="question-level">${level}</p>				
				<div class="card-toolbar">										
					<button class="edit-info">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
					</button>
					<button class="card-delete">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
					</button>
				</div>				
				<div class="${!isEditingInfo ? "card-info" : "card-edit"}">
					<p contentEditable="${isEditingInfo ? "true" : "false"}" class="question front ${isEditingInfo ? "editing" : ""}" data-back="${back}">${front}</p>
					${isEditingInfo ? `<p contentEditable="${isEditingInfo ? "true" : "false"}" class="question back ${isEditingInfo ? "editing" : ""}">${back}</p>` : ""}
				</div>				
				${isEditingInfo ? '<button class="edit-button"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg></button>' : ""}
				${!isEditingInfo ? cardAction : ""}
			`;
			setElSessCardListener(container, moduleId, unitId, id, key);
			return container;
		case "truefalse":
			break;
		case "identification":
			break;
		case "multiple":
			break;
	}
}
