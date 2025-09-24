const browser = chrome;
const storage = browser.storage;
const local = storage.local;

const INTERVALS = {
	timer: undefined,
};

const CARDS = {
	1: [],
	2: [],
	3: [],
	4: [],
	5: [],
};

async function init() {
	if (isScraping(window.location.search)) {
		scrapeAI();
		return;
	}

	const userdata = await local.get(null);
	const { modules } = userdata;

	const { host, root } = createShadowDOM(userdata);
	update_show_keyword(host, userdata);
	document.documentElement.appendChild(host);

	if (userdata.inject.answered) {
		root.querySelector(".card")?.remove();
		startCounting(userdata);
	} else {
		setCards(modules);
		appendCard(root);
	}

	storage.onChanged.addListener(async () => {
		const userdata = await local.get(null);
		const { modules } = userdata;

		update_show_keyword(host, userdata);

		if (userdata.inject.answered) {
			// If answered, remove the popups from current and other pages
			root.querySelector(".card")?.remove();
			// And start counding
			startCounting(userdata);
		} else {
			// If user now has to answer, prep the cards
			setCards(modules);
			// And append it
			appendCard(root);
		}
	});
}

function isScraping(str) {
	return /muniscrape=true/.test(str);
}

function setCards(modules) {
	if (modules.length === 0) return;

	// Reset cards
	for (let key of Object.keys(CARDS)) {
		CARDS[key] = [];
	}

	// There are better ways to do this, but this system has became an amalgamation of bad decisions and mental instability

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
}
async function appendCard(root) {
	const { card, key } = await getToDisplayCard();
	const popup_card = await getElPageCard(card, key, root);

	// Remove existing card if it exists
	root.querySelector(".card")?.remove();
	if (popup_card) root.appendChild(popup_card);
}

async function getToDisplayCard() {
	const userdata = await local.get(null);
	const learning_mode = userdata.settings.rules.learning_mode;
	if (learning_mode === "short") {
		const level_one_chance = CARDS[1].length ? new Array(3 * CARDS[1].length).fill(1) : []; // Amplify the chance of low level cards
		const level_two_chance = CARDS[2].length ? new Array(2 * CARDS[2].length).fill(2) : [];
		const level_three_chance = CARDS[3].length ? new Array(CARDS[3].length).fill(3) : [];
		const level_four_chance = CARDS[4].length ? new Array(CARDS[4].length).fill(4) : [];
		const level_five_chance = CARDS[5].length ? new Array(CARDS[5].length).fill(5) : [];

		const probability = [level_one_chance, level_two_chance, level_three_chance, level_four_chance, level_five_chance].flat();

		// Yes, I know. This system has became way too shit. It's a workaround for my renderer
		if (probability.length === 0) return { card: null, key: null };

		const get_random_level = probability[Math.floor(Math.random() * probability.length)];

		const card = CARDS[get_random_level][0] !== undefined ? CARDS[get_random_level][0] : null;

		if (card) {
			return { card, key: get_random_level };
		} else return { card: null, key: null };
	} else if (learning_mode === "long") {
		const { modules } = userdata;

		for (let i = 0; i < modules.length; i++) {
			if (!modules[i].isActive) continue;

			const units = modules[i].units;
			for (let j = 0; j < units.length; j++) {
				if (!units[j].isActive) continue;

				const cards = units[j].cards;
				const now = new Date();
				for (let k = 0; k < cards.length; k++) {
					const card = cards[k];
					if (now >= new Date(card.next_review)) {
						return { card };
					}
				}
			}
		}

		return { card: null };
	}
}

async function getElPageCard(card, key, root) {
	if (card === null) return;

	const { settings } = await local.get("settings");
	const is_show_keyword = settings.rules.show_keyword;

	const { id, type, card_type, level, isEditing, moduleId, unitId, moduleTitle, unitTitle } = card;
	const svgColor = "#242424";

	const container = create_element("div", { class: "card", dataset: { id } });

	switch (card_type) {
		case "flashcard":
			const { front, back, keyword, hint } = card;
			container.classList.add("card-flashcard");

			// TO IMPLEMENT
			const isEditingInfo = isEmptyStr(front) || isEmptyStr(back) || isEditing;
			if (isEditingInfo) container.classList.add("session-card-edit");

			const cardAction = `
                <div class="card-flashcard-action">
					<button data-grade="1" class="card-backward">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
					</button>
					<button data-grade="2" class="card-backward">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
					</button>
					<button data-grade="3">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
					</button>
					<button data-grade="4">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>
					</button>
					<button data-grade="5" class="card-forward">
						<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>
					</button>
				</div>
			`;

			container.innerHTML = `				
				<div class="info-container">
					<p class="question-info">${cutString(moduleTitle)} > ${cutString(unitTitle)}</p>                    
					<div class="card-toolbar">																
						<button class="show-hint ${isEditingInfo ? "no-display" : ""}">
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="M400-240q-33 0-56.5-23.5T320-320v-50q-57-39-88.5-100T200-600q0-117 81.5-198.5T480-880q117 0 198.5 81.5T760-600q0 69-31.5 129.5T640-370v50q0 33-23.5 56.5T560-240H400Zm0-80h160v-92l34-24q41-28 63.5-71.5T680-600q0-83-58.5-141.5T480-800q-83 0-141.5 58.5T280-600q0 49 22.5 92.5T366-436l34 24v92Zm0 240q-17 0-28.5-11.5T360-120v-40h240v40q0 17-11.5 28.5T560-80H400Zm80-520Z"/></svg>
						</button>									
						<button class="edit-info">
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
						</button>
						<button class="card-delete ${isEditingInfo ? "no-display" : ""}">
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
						</button>
					</div>
				</div>				
				<div class="${!isEditingInfo ? "card-info" : "card-edit"}">
					<p contentEditable="${isEditingInfo ? "true" : "false"}" class="question front ${isEditingInfo ? "editing" : ""}">${front}</p>
					<p contentEditable="${isEditingInfo ? "true" : "false"}" class="question back ${isEditingInfo ? "editing" : "no-display"}">${back}</p>					
					<p contentEditable="${isEditingInfo ? "true" : "false"}" class="hint ${isEditingInfo ? "editing" : "no-display"}">${hint}</p>
					<p contentEditable="${isEditingInfo ? "true" : "false"}" class="keyword ${is_show_keyword ? "" : "no-display"} ${isEditingInfo ? "editing" : ""}">${keyword}</p>					
				</div>				
				${isEditingInfo ? '<button class="edit-button"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg></button>' : ""}

				${!isEditingInfo ? cardAction : ""}
			`;

			setElSessCardListener(container, moduleId, unitId, id, level, root);
			return container;
		case "truefalse":
			break;
		case "identification":
			break;
		case "multiple":
			break;
	}
}

function setElSessCardListener(container, moduleId, unitId, cardId, key, root) {
	const card_level_action = container.querySelector(".card-flashcard-action");

	card_level_action?.addEventListener("click", async (event) => {
		if (event.target.nodeName === "DIV") return;
		const target = event.target.closest("button");

		const userdata = await local.get(null);
		const learning_mode = userdata.settings.rules.learning_mode;
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);

		if (learning_mode === "short") {
			console.log(0);
			switch (parseInt(target.dataset.grade)) {
				case 1: {
					// You don't know the answer at all
					// Move it to the lowest level, and just before the front
					if (key === 1) return;

					userdata.inject.answered = true;
					userdata.inject.time = String(new Date());
					userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level = 1;

					await local.set(userdata);
					break;
				}
				case 2: {
					// Wrong answer, but the answer seems familiar
					// Move it to the lower level, and at the back

					// Delete the card to update its position
					const card_level = userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level;
					userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level = Math.max(card_level - 1, 1);

					userdata.inject.answered = true;
					userdata.inject.time = String(new Date());
					await local.set(userdata);
					break;
				}
				case 3: {
					// Correct answer but slightly incorrect, it took a lot of thinking
					// Move it to the higher level, and at the front

					userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level += 1; // Storage change state

					userdata.inject.answered = true;
					userdata.inject.time = String(new Date());
					await local.set(userdata);
					break;
				}
				case 4: {
					// Correct answer but with hesitation
					// Move it to the higher level 2 times

					const card_level = userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level;
					userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level = Math.min(card_level + 2, 6);

					userdata.inject.answered = true;
					userdata.inject.time = String(new Date());
					await local.set(userdata);
					break;
				}
				case 5: {
					// Correct answer with confidence
					// Move it to the higher level 3 times, and at the back

					const card_level = userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level;
					userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level = Math.min(card_level + 3, 6);

					userdata.inject.answered = true;
					userdata.inject.time = String(new Date());
					await local.set(userdata);
					break;
				}
			}
		} else if (learning_mode === "long") {
			console.log(1);
			const grade = parseInt(target.dataset.grade);
			const card = userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex];
			switch (parseInt(target.dataset.grade)) {
				case 1:
				case 2: {
					card.repetitions = 0;
					card.interval = 1;
					card.easiness = Math.max(1.3, card.easiness - 0.2);
					break;
				}
				case 3:
				case 4:
				case 5: {
					card.repetitions += 1;
					if (card.repetitions === 1) {
						card.interval = 1;
					} else if (card.repetitions === 2) {
						card.interval = 3;
					} else {
						card.interval = Math.round(card.interval * card.easiness);
					}
					card.easiness = Math.max(1.3, card.easiness + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
					break;
				}
			}
			card.next_review = calculate_next_review(card.interval);

			userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex] = card;
			await local.set(userdata);
		}
	});

	container.querySelector(".show-hint")?.addEventListener("click", () => {
		const hint = root.querySelector(".hint");
		hint.classList.toggle("no-display");
	});

	container.querySelector(".card-info")?.addEventListener("click", async ({ target }) => {
		target = target.closest(".card-info");
		const front = target.children[0];
		const back = target.children[1];
		const hint = target.children[2];
		const keyword = target.children[3];

		back.classList.toggle("no-display");
		front.classList.toggle("no-display");
		hint.classList.add("no-display");

		if (document.getElementById("muni-main").dataset.keyword == "true") keyword.classList.toggle("no-display");
	});

	container.querySelector(".edit-button")?.addEventListener("click", async () => {
		const front = container.querySelector(".front");
		const back = container.querySelector(".back");
		const keyword = container.querySelector(".keyword");
		const hint = container.querySelector(".hint");

		if (isEmptyStr(front.innerText) || isEmptyStr(back.innerText)) {
			alert("Please finish editing");
		} else {
			const userdata = await local.get(null);

			const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
			userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].front = front.innerText;
			userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].back = back.innerText;
			userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].keyword = keyword.innerText;
			userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].hint = hint.innerText;
			userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].isEditing = false;

			await local.set(userdata);
		}
	});

	container.querySelector(".edit-info").addEventListener("click", async () => {
		const userdata = await local.get(null);
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
		const isEditing = userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].isEditing;
		userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].isEditing = !isEditing; // Storage change state

		await local.set(userdata);
	});

	container.querySelector(".card-delete").addEventListener("click", async () => {
		const userdata = await local.get(null);
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
		userdata.modules[moduleIndex].units[unitIndex].cards.splice(cardIndex, 1); // Storage change state
		await local.set(userdata);
	});
}

function update_show_keyword(host, userdata) {
	const { settings } = userdata;
	const is_show_keyword = settings.rules.show_keyword;
	host.dataset.keyword = is_show_keyword;
}

function createShadowDOM() {
	const host = document.createElement("div");
	const root = host.attachShadow({ mode: "closed" });
	const link = document.createElement("link");
	const style = document.createElement("style");
	style.innerHTML = `
		@font-face {
			font-family: "Muni-Montserrat";
			src: url("${chrome.runtime.getURL("assets/Montserrat.ttf")}");
		}
	`;
	host.setAttribute("id", "muni-main");
	link.type = "text/css";
	link.rel = "stylesheet";
	link.href = chrome.runtime.getURL("css/inject.css");

	document.head.appendChild(style);
	root.appendChild(link);
	return { host, root };
}

function isEmptyStr(str) {
	return str.replace(/\s+/g, "").length === 0;
}

function cutString(str, length = 10) {
	if (isEmptyStr(str)) return "..";
	return str.length > length ? str.slice(0, length) + ".." : str;
}

function getIndexes(userdata, moduleId = -1, unitId = -1, cardId = -1) {
	const indexes = { moduleIndex: null, unitIndex: null, cardIndex: null };
	const { modules } = userdata;

	const moduleIndex = modules.findIndex((module) => module.id === parseInt(moduleId));
	if (moduleId >= 0) {
		indexes.moduleIndex = moduleIndex;
	}
	if (unitId >= 0) {
		const unitIndex = modules[moduleIndex].units.findIndex((unit) => unit.id === parseInt(unitId));
		indexes.unitIndex = unitIndex;
	}
	if (cardId >= 0) {
		const unitIndex = modules[moduleIndex].units.findIndex((unit) => unit.id === parseInt(unitId));
		const cardIndex = modules[moduleIndex].units[unitIndex].cards.findIndex((card) => card.id === parseInt(cardId));
		indexes.cardIndex = cardIndex;
	}
	return indexes;
}
// This affects the tab, I should really add 'reason' rendering logic
function startCounting(userdata) {
	const time = new Date(userdata.inject.time);
	const intervalMs = new Date(userdata.settings.rules.intervalMs);

	if (INTERVALS.timer) clearInterval(INTERVALS.timer);

	// Use setInterval instead of setTimeout to avoid script death
	INTERVALS.timer = setInterval(async () => {
		const elapsedTime = new Date() - time;
		// console.log("Counting: " + elapsedTime);
		if (elapsedTime >= intervalMs) {
			// console.log("Finished counting: " + elapsedTime);
			const { inject } = await local.get("inject");
			inject.answered = false;
			await local.set({ inject });
			clearInterval(INTERVALS.timer);
		}
	}, 1000);
}

function create_element(name, attr) {
	const element = document.createElement(name);

	for (let key in attr) {
		if (key === "dataset" && typeof attr[key] === "object") {
			for (let data in attr.dataset) {
				element.dataset[data] = attr.dataset[data];
			}
		} else if (key in element) {
			element[key] = attr[key];
		} else {
			element.setAttribute(key, attr[key]);
		}
	}

	return element;
}

// -- SCRAPING START --
function scrapeAI() {
	hide_webscraping();
	chrome.runtime.onMessage.addListener((receive, _, send) => {
		const { message } = receive;
		if (message === "scrape-gpt") {
			const INPUT = document.querySelector("div[contentEditable]");
			// There should be fallback if after 30s and there's still nothing

			// Start scraping
			INPUT.innerText = receive.instruction;
			console.log("Set the input");
			setTimeout(() => {
				const BUTTON = document.getElementById("composer-submit-button");
				BUTTON.click();
				console.log("Clicked the button");

				// Send the response whatever happened after 120s
				const sendResponse = setTimeout(() => {
					const ANSWERS = document.querySelectorAll("div[data-message-author-role='assistant']");
					send({ message: "success", qa: ANSWERS[ANSWERS.length - 1]?.innerText });
				}, 120_000);

				// Set the interval
				const checkFinish = setInterval(() => {
					console.log("Checking");
					const FINISHED = document.getElementById("composer-submit-button").getAttribute("disabled");
					if (FINISHED === "") {
						console.log("Finished");
						clearInterval(checkFinish);
						clearTimeout(sendResponse);

						// It seems like there's some delay with data & display
						setTimeout(() => {
							const ANSWERS = document.querySelectorAll("div[data-message-author-role='assistant']");
							send({ message: "success", qa: ANSWERS[ANSWERS.length - 1]?.innerText });
						}, 3000);
					}
				}, 500);
			}, 1000);

			return true;
		} else if (message === "scrape-gemini") {
			const PARENT = document.querySelector("div[class*='text-input-field']");
			const INPUT = PARENT.querySelector("div[contentEditable]");
			const BUTTON = PARENT.querySelector("button[class*='submit']");

			INPUT.innerText = receive.instruction;
			console.log("Set input");

			const send_response = () => {
				const ANSWERS = document.querySelectorAll("message-content");
				const EDITOR = document.querySelector("immersive-editor");
				if (ANSWERS.length !== 0) {
					let answer = "";
					if (EDITOR) answer = document.querySelector("immersive-editor div[contentEditable]")?.innerText;
					send({ message: "success", qa: ANSWERS[ANSWERS.length - 1].innerText, answer: EDITOR ? answer : "" });
				}
			};

			setTimeout(() => {
				BUTTON.click();
				console.log("Button clicked");

				// Send whatever after 120s
				const sendResponse = setTimeout(() => {
					send_response();
				}, 120_000);

				// Send early if finished early
				const checkFinish = setInterval(() => {
					console.log("Checking");
					const FINISHED = PARENT.querySelector("div[class*='send-button-container']");
					if (FINISHED.classList.contains("disabled")) {
						console.log("Finished");
						clearInterval(checkFinish);
						clearTimeout(sendResponse);

						setTimeout(() => {
							send_response();
						}, 3000);
					}
				}, 500);
			}, 500);

			return true;
		}
	});
}

function hide_webscraping() {
	console.warn("Scraping");
	document.documentElement.style = "opacity: 0; background-color: black;";
}

function calculate_next_review(interval) {
	const now = new Date();
	const next_review_date = new Date(now);
	next_review_date.setDate(now.getDate() + interval);
	return next_review_date.toISOString();
}

// -- SCRAPING END --

function developer_mode() {
	window.addEventListener("beforeunload", () => {
		chrome.runtime.sendMessage({ message: "reload" });
	});
}

init();
// developer_mode();
