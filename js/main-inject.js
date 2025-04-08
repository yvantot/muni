const browser = chrome;
const storage = browser.storage;
const local = storage.local;

// DEV TOOLS
window.addEventListener("beforeunload", () => {
	// chrome.runtime.sendMessage({ message: "reload" });
});

// There's a better way to do this, but fuck it, this system has become a mess that it's not worth it anymore
// I'll use web compontents next time
const CARDS = {
	1: [],
	2: [],
	3: [],
	4: [],
	5: [],
};

async function init() {
	const userdata = await local.get(null);
	const { host, root } = createShadowDOM();
	document.documentElement.appendChild(host);

	// If already answered, then don't do anything
	if (userdata.inject.answered) {
		root.querySelector(".card")?.remove();
		return;
	}

	setCards(userdata.modules);
	const card = getToDisplayCard(CARDS);
	appendCard(root, card);

	storage.onChanged.addListener(async () => {
		const newData = await local.get(null);
		if (newData.inject.answered) {
			root.querySelector(".card")?.remove();
			return;
		}

		setCards(newData.modules);
		const newCard = getToDisplayCard(CARDS);
		appendCard(root, newCard);
	});
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
	// Reset cards

	modules.forEach((module) => {
		if (module.isActive) {
			module.units.forEach((unit) => {
				if (unit.isActive) {
					unit.cards.forEach((card) => {
						card.moduleTitle = module.title;
						card.unitTitle = unit.title;
						card.moduleId = module.id;
						card.unitId = unit.id;
					});
				}
			});
		}
	});

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
	for (let i = 1; i <= 5; i++) {
		if (CARDS[i].length !== 0) return CARDS[i][0];
	}
	return null;
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
                        ${level !== 1 ? '<button class="card-backward"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" /></svg></button><div class="line-vertical"></div>' : ""}										
                        <button class="card-forward">
                            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="${svgColor}"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z" /></svg>
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
