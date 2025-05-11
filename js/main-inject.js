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
// DEV TOOLS
window.addEventListener("beforeunload", () => {
	// chrome.runtime.sendMessage({ message: "reload" });
});

function scrapeAI() {
	console.warn("Scraping");

	// document.documentElement.style = "display: none;";
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

				// Send the response whatever happened after 60s
				const sendResponse = setTimeout(() => {
					const ANSWERS = document.querySelectorAll("div[data-message-author-role='assistant']");
					send({ message: "success", qa: ANSWERS[ANSWERS.length - 1]?.innerText });
				}, 60_000);

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

				// Send whatever after 60s
				const sendResponse = setTimeout(() => {
					send_response();
				}, 60_000);

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

async function init() {
	chrome.runtime.sendMessage({ message: "wake-bg" });

	// Stop if scraping
	if (isScraping(window.location.search)) {
		scrapeAI();
		return;
	}

	storage.onChanged.addListener(async () => {
		const newData = await local.get(null);

		if (newData.inject.answered) {
			root.querySelector(".card")?.remove();
			startCounting(newData);
			return;
		}

		setCards(newData.modules);
		const newCard = getToDisplayCard(CARDS);
		appendCard(root, newCard);
	});

	const userdata = await local.get(null);
	const { host, root } = createShadowDOM();
	document.documentElement.appendChild(host);

	// If already answered, start counting
	if (userdata.inject.answered) {
		root.querySelector(".card")?.remove();
		startCounting(userdata);
		return;
	}

	setCards(userdata.modules);
	const card = getToDisplayCard(CARDS);
	appendCard(root, card);
}
function isScraping(str) {
	return /muniscrape=true/.test(str);
}

function appendCard(root, card) {
	// Remove existing card if it exists
	root.querySelector(".card")?.remove();
	root.appendChild(getElPageCard(card));
}

function setCards(modules) {
	if (!modules) return;

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

function getToDisplayCard(CARDS) {
	const level_one_chance = CARDS[1].length ? [] : new Array(10).fill(1);
	const level_two_chance = CARDS[2].length ? [] : new Array(8).fill(2);
	const level_three_chance = CARDS[3].length ? [] : new Array(5).fill(3);
	const level_four_chance = CARDS[4].length ? [] : new Array(3).fill(4);
	const level_five_chance = CARDS[5].length ? [] : new Array(1).fill(5);

	const probability = [level_one_chance, level_two_chance, level_three_chance, level_four_chance, level_five_chance].flat();

	if (probability.length === 0) return null;

	const get_random_level = probability[Math.floor(Math.random() * probability.length)];

	return CARDS[get_random_level][0] !== undefined ? CARDS[get_random_level][0] : null;
}

function getElPageCard(card) {
	const { id, card_type, level, isEditing, moduleId, unitId, moduleTitle, unitTitle } = card;
	const svgColor = "#242424";

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
                        <button id-grade="1" class="card-backward">
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
						</button>
						<button id-grade="2" class="card-backward">
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg>
						</button>
						<button id-grade="3">
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M720-120H280v-520l280-280 50 50q7 7 11.5 19t4.5 23v14l-44 174h258q32 0 56 24t24 56v80q0 7-2 15t-4 15L794-168q-9 20-30 34t-44 14Zm-360-80h360l120-280v-80H480l54-220-174 174v406Zm0-406v406-406Zm-80-34v80H160v360h120v80H80v-520h200Z"/></svg>
						</button>
						<button id-grade="4">
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>
						</button>
						<button id-grade="5" class="card-forward">
							<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m354-287 126-76 126 77-33-144 111-96-146-13-58-136-58 135-146 13 111 97-33 143ZM233-120l65-281L80-590l288-25 112-265 112 265 288 25-218 189 65 281-247-149-247 149Zm247-350Z"/></svg>
						</button>
                    </div>
                `;

			container.innerHTML = `				
                    <div class="info-container">
                    	<p class="question-info">${cutString(moduleTitle)} > ${cutString(unitTitle)}</p>                    
	                    <div class="card-toolbar">										
	                        <button class="edit-info">
	                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
	                        </button>
	                        <button class="card-delete">
	                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
	                        </button>
	                    </div>
                    </div>				
                    <div class="${!isEditingInfo ? "card-info" : "card-edit"}">
                        <p contentEditable="${isEditingInfo ? "true" : "false"}" class="question front ${isEditingInfo ? "editing" : ""}">${front}</p>
                        <p contentEditable="${isEditingInfo ? "true" : "false"}" class="question back ${isEditingInfo ? "editing" : ""}">${back}</p>					
                    </div>				
                    ${isEditingInfo ? '<button class="edit-button"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg></button>' : ""}
                    ${!isEditingInfo ? cardAction : ""}
                `;

			setElSessCardListener(container, moduleId, unitId, id, level);
			return container;
		case "truefalse":
			break;
		case "identification":
			break;
		case "multiple":
			break;
	}
}

function setElSessCardListener(container, moduleId, unitId, cardId, key) {
	const card_level_action = container.querySelector(".card-flashcard-action");

	container.querySelector(".card-backward")?.addEventListener("click", async () => {
		if (key === 1) return;

		const userdata = await local.get(null);
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
		userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level = key - 1;
		userdata.inject.answered = true;
		userdata.inject.time = String(new Date());
		await local.set(userdata);
	});

	container.querySelector(".card-forward")?.addEventListener("click", async () => {
		const userdata = await local.get(null);
		if (key === 6) return;
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
		userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level = key + 1; // Storage change state
		userdata.inject.answered = true;
		userdata.inject.time = String(new Date());
		await local.set(userdata);
	});

	function moveAtStart(array, index) {
		const [item] = array.splice(index, 1);
		array.push(item);
	}

	card_level_action.addEventListener("click", async (event) => {
		const { target } = event;

		switch (parseInt(target.dataset.grade)) {
			case 1: {
				// You don't know the answer at all
				// Move it to the lowest level, and at the front
				const userdata = await local.get(null);
				const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
				userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].level = 1;
				const [item] = userdata.modules[moduleIndex].units[unitIndex].cards.splice(cardIndex, 1);
				userdata.modules[moduleIndex].units[unitIndex].cards.push(item);

				userdata.inject.answered = true;
				userdata.inject.time = String(new Date());
				await local.set(userdata);
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

init();
