// session.js
import { ELEMENTS, local } from "../utilities/global.js";
import { getIndexes, isEmptyStr, cutString, create_element } from "../utilities/utilities.js";

const BUTTONS = {
	SHUFFLE: document.getElementById("shuffle-cards"),
	FOCUS: document.getElementById("focus-ui"),
};

const CARDS = {
	1: [],
	2: [],
	3: [],
	4: [],
	5: [],
};

export function setCards(userdata) {
	const { modules } = userdata;

	if (!modules.length) return null;

	// Set cards to default
	for (let key of Object.keys(CARDS)) {
		CARDS[key] = [];
	}

	const cards = modules.flatMap((module) => {
		if (module.isActive) {
			return module.units.flatMap((unit) => (unit.isActive ? unit.cards : []));
		}
		return [];
	});

	cards.forEach((card) => {
		if (card.level <= 5) {
			CARDS[card.level].push(card);
		}
	});

	updateElCardLevels();
}

function getToDisplayCard() {
	const level_one_chance = CARDS[1].length ? new Array(3 ** 5).fill(1) : [];
	const level_two_chance = CARDS[2].length ? new Array(3 ** 4).fill(2) : [];
	const level_three_chance = CARDS[3].length ? new Array(3 ** 3).fill(3) : [];
	const level_four_chance = CARDS[4].length ? new Array(3 ** 2).fill(4) : [];
	const level_five_chance = CARDS[5].length ? new Array(3).fill(5) : [];

	const probability = [level_one_chance, level_two_chance, level_three_chance, level_four_chance, level_five_chance].flat();
	console.log(probability);

	// Yes, I know. This system has became way too shit. It's a workaround for my renderer
	if (probability.length === 0) return { card: null, key: null };

	const get_random_level = probability[Math.floor(Math.random() * probability.length)];

	const card = CARDS[get_random_level][0] !== undefined ? CARDS[get_random_level][0] : null;

	if (card) {
		return { card, key: get_random_level };
	} else return { card: null, key: null };
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
	updateElCardLevels();
}

function shuffleArray(array) {
	console.log(array);
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	console.log(array);
	return array;
}

export function setElSessionlistener() {
	const { SHUFFLE, FOCUS } = BUTTONS;

	SHUFFLE.addEventListener("click", () => {
		for (let i = 1; i <= Object.keys(CARDS).length; i++) {
			if (CARDS[i].length > 1) {
				CARDS[i] = shuffleArray(CARDS[i]);
			}
		}
		renderElSession();
	});
	FOCUS.addEventListener("click", () => {
		ELEMENTS.SESSION_LEVELS_CONTAINER.classList.toggle("invisible");
	});
}

function setElSessCardListener(container, moduleId, unitId, cardId, key) {
	const card_level_action = container.querySelector(".card-flashcard-action");

	card_level_action?.addEventListener("click", async (event) => {
		const target = event.target.closest("button");

		switch (parseInt(target.dataset.grade)) {
			case 1: {
				// You don't know the answer at all
				// Move it to the lowest level, and just before the front

				// TODO !NOT FINISHED!

				if (CARDS[key][0].level === 1) return;

				const userdata = await local.get(null);
				const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
				userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level = 1;
				const card = userdata.modules[moduleIndex].units[unitIndex].cards.splice(cardIndex, 1)[0];
				userdata.modules[moduleIndex].units[unitIndex].cards.unshift(card);

				userdata.inject.answered = true;
				userdata.inject.time = String(new Date());
				await local.set(userdata);

				CARDS[key][0].level = 1;
				CARDS[1].unshift(CARDS[key][0]);
				CARDS[key].splice(0, 1); // Delete the card from its current level

				renderElSession();
				updateElCardLevels();
				break;
			}
			case 2: {
				// Wrong answer, but the answer seems familiar
				// Move it to the lower level, and at the back
				break;
			}
			case 3: {
				// Correct answer but slightly incorrect, it took a lot of thinking
				// Move it to the higher level, and at the front
				alert(1);
				break;
			}
			case 4: {
				// Correct answer but with hesitation
				// Move it to the higher level, and at the back
				break;
			}
			case 5: {
				// Correct answer with confidence
				// Move it to the higher level 2 times, and at the back
				break;
			}
		}
	});

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

	container.querySelector(".card-info")?.addEventListener("click", async ({ target }) => {
		target = target.closest(".card-info");
		const front = target.children[0];
		const back = target.children[1];
		const keyword = target.children[2];

		back.classList.toggle("no-display");
		front.classList.toggle("no-display");
		if (document.getElementById("is-show-keyword").dataset.enabled == true) keyword.classList.toggle("no-display");
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

	const is_show_keyword = document.getElementById("is-show-keyword").dataset.enabled == true; // "0" == true IM LAZY NAHHH

	const container = create_element("div", { class: "card", dataset: { id } });

	switch (card_type) {
		case "flashcard":
			const { front, back, keyword, hint } = card;
			container.classList.add("card-flashcard");

			const isEditingInfo = isEmptyStr(front) || isEmptyStr(back) || isEditing;
			if (isEditingInfo) container.classList.add("session-card-edit");

			const cardAction = `
				<div class="card-flashcard-action">
					<button data-grade="1" class="card-backward" ${level === 1 ? 'style="opacity: 0.1; cursor: default; background-color: hsl(0, 0%, 5%);"' : ""}>
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
					</button>
					<button data-grade="2" class="card-backward">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
					</button>
					<button data-grade="3">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
					</button>
					<button data-grade="4">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>
					</button>
					<button data-grade="5" class="card-forward">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>
					</button>
				</div>
			`;

			container.innerHTML = `				
				<p class="question-info">${cutString(moduleTitle)} > ${cutString(unitTitle)}</p>
				<p class="question-level color-level-${level}">${level}</p>				
				<div class="card-toolbar">	
					<button class="show-hint">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M400-240q-33 0-56.5-23.5T320-320v-50q-57-39-88.5-100T200-600q0-117 81.5-198.5T480-880q117 0 198.5 81.5T760-600q0 69-31.5 129.5T640-370v50q0 33-23.5 56.5T560-240H400Zm0-80h160v-92l34-24q41-28 63.5-71.5T680-600q0-83-58.5-141.5T480-800q-83 0-141.5 58.5T280-600q0 49 22.5 92.5T366-436l34 24v92Zm0 240q-17 0-28.5-11.5T360-120v-40h240v40q0 17-11.5 28.5T560-80H400Zm80-520Z"/></svg>
					</button>									
					<button class="edit-info">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
					</button>
					<button class="card-delete">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
					</button>
				</div>				
				<div class="${!isEditingInfo ? "card-info" : "card-edit"}">
					<p contentEditable="${isEditingInfo ? "true" : "false"}" class="question front ${isEditingInfo ? "editing" : ""}">${front}</p>
					<p contentEditable="${isEditingInfo ? "true" : "false"}" class="question back ${isEditingInfo ? "editing" : "no-display"}">${back}</p>					
					<p contentEditable="${isEditingInfo ? "true" : "false"}" class="keyword ${is_show_keyword ? "" : "no-display"} ${isEditingInfo ? "editing" : ""}">${keyword}</p>
					<p contentEditable="${isEditingInfo ? "true" : "false"}" class="hint no-display ${isEditingInfo ? "editing" : ""}">${hint}</p>
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
