import { STORAGE_STRUCT, ELEMENTS, browser, storage, local } from "./utilities/global.js";

async function init() {
	// On start
	initListeners();

	let userdata = await local.get(null);
	if (Object.keys(userdata).length === 0) {
		userdata = STORAGE_STRUCT;
		await local.set(STORAGE_STRUCT);
	}

	renderElLibrary(userdata, -1, -1);

	// On storage change
	storage.onChanged.addListener(update);
}

async function update() {}

function initListeners() {
	const { LIBRARY_CONTENTS, LIBRARY_BACK, LIBRARY_ADD } = ELEMENTS;

	LIBRARY_BACK.addEventListener("click", async () => {
		const userdata = await local.get(null);
		const currentNav = LIBRARY_CONTENTS.dataset.currentNav;
		const moduleIndex = LIBRARY_CONTENTS.dataset.moduleIndex;

		if (currentNav === "units") {
			renderElLibrary(userdata, -1, -1);
			LIBRARY_CONTENTS.dataset.currentNav = "modules";
		} else if (currentNav === "cards") {
			renderElLibrary(userdata, moduleIndex, -1);
			LIBRARY_CONTENTS.dataset.currentNav = "units";
		}
	});

	LIBRARY_ADD.addEventListener("click", async () => {
		const userdata = await local.get(null);
		const currentNav = LIBRARY_CONTENTS.dataset.currentNav;
		const moduleIndex = LIBRARY_CONTENTS.dataset.moduleIndex;
		const unitIndex = LIBRARY_CONTENTS.dataset.unitIndex;

		if (currentNav === "units") {
			let id = getMaxNumber(userdata.modules[moduleIndex].units.map((unit) => unit.id));
			if (userdata.modules[moduleIndex].units.length !== 0) id += 1;

			userdata.modules[moduleIndex].units.push({
				id,
				type: "unit",
				title: "Unit",
				description: "Unit",

				createdAt: String(new Date()),
				isActive: true,
				cards: [],
			});

			await local.set(userdata);
		} else if (currentNav === "cards") {
			let id = getMaxNumber(userdata.modules[moduleIndex].units[unitIndex].cards.map((card) => card.id));
			if (userdata.modules[moduleIndex].units[unitIndex].cards.length !== 0) id += 1;

			userdata.modules[moduleIndex].units[unitIndex].cards.push({
				id,
				type: "card",
				card_type: "flashcard",
				level: 0,
				createdAt: String(new Date()),

				front: "Front",
				back: "Back",
			});

			await local.set(userdata);
		} else {
			let id = getMaxNumber(userdata.modules.map((module) => module.id));
			if (userdata.modules.length !== 0) id += 1;

			userdata.modules.push({
				id,
				type: "module",
				title: "Module",
				description: "Module",

				author: "Author",
				createdAt: String(new Date()),
				isActive: true,
				units: [],
			});

			await local.set(userdata);
		}
	});
}

function getMaxNumber(arr) {
	if (arr.length === 0) return 0;

	let max = arr[0];
	for (let i = 1; i < arr.length; i++) {
		if (arr[i] > max) max = arr[i];
	}
	return max;
}

function renderElLibrary(userdata, moduleIndex, unitIndex) {
	const { LIBRARY_CONTENTS } = ELEMENTS;
	LIBRARY_CONTENTS.innerHTML = "";

	const { modules } = userdata;
	console.log(modules);

	if (moduleIndex === -1 && unitIndex === -1) {
		// Render modules
		LIBRARY_CONTENTS.appendChild(getElModules(modules));
	} else if (moduleIndex >= 0 && unitIndex === -1) {
		// Render units
		LIBRARY_CONTENTS.dataset.moduleIndex = moduleIndex;
		LIBRARY_CONTENTS.appendChild(getElUnits(modules[moduleIndex].units));
	} else if (moduleIndex >= 0 && unitIndex >= 0) {
		// Render cards
		LIBRARY_CONTENTS.appendChild(getElCards(modules[moduleIndex].units[unitIndex].cards));
	}
}

function getElModules(modules) {
	const container = document.createElement("div");
	container.classList.add("modules-container");
	modules.forEach((module) => {
		container.appendChild(getElModule(module));
	});
	return container;
}

function getElModule(module) {
	const { id, type, title, description, author, createdAt, isActive, units } = module;

	const unitsCount = units.length;
	const cardsCount = getCardsCount(units);
	const container = document.createElement("div");

	container.classList.add("module");
	container.dataset.type = type;
	container.dataset.id = id;

	container.innerHTML = `
        <div class="module-toolbar">
            <button>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>
            </button>
            <button class="card-edit">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
            </button>
            <button class="card-delete">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
            </button>
        </div>        
        <button class='forward-button'>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
        </button>
        <div class="module-info">
            <p class="module-title">${title}</p>
            <p class="module-description">${description}</p>
            <p class="module-createdAt">${dateToYYYYMMDD(new Date(createdAt))}</p>
            <div class="module-info">
                <p>${author}</p>
                <p>${unitsCount} unit${addPlural(unitsCount)} - ${cardsCount} card${addPlural(cardsCount)}</p>
            </div>
        </div>
    `;
	setElModuleListener(container, id);
	return container;
}

function addPlural(length) {
	if (length > 1) return "s";
	return "";
}

function getCardsCount(units) {
	let cardsCount = 0;
	for (let i = 0; i < units.length; i++) {
		cardsCount += units[i].cards.length;
	}
	return cardsCount;
}

function setElModuleListener(container, id) {
	const forward = container.querySelector(".forward-button");
	forward.addEventListener("click", async () => {
		const userdata = await local.get(null);

		ELEMENTS.LIBRARY_CONTENTS.dataset.currentNav = "units";
		renderElLibrary(userdata, id, -1);
	});
}

function setElUnitListener(container, id) {
	const forward = container.querySelector(".forward-button");
	forward.addEventListener("click", async () => {
		const userdata = await local.get(null);

		const moduleIndex = ELEMENTS.LIBRARY_CONTENTS.dataset.moduleIndex;
		ELEMENTS.LIBRARY_CONTENTS.dataset.currentNav = "cards";
		ELEMENTS.LIBRARY_CONTENTS.dataset.unitIndex = id;
		renderElLibrary(userdata, moduleIndex, id);
	});
}

function getElUnits(units) {
	const container = document.createElement("div");
	container.classList.add("units-container");
	units.forEach((unit) => {
		container.appendChild(getElUnit(unit));
	});
	return container;
}

function getElUnit(unit) {
	const { id, type, title, description, createdAt, isActive, cards } = unit;

	const container = document.createElement("div");

	container.classList.add("unit");
	container.dataset.type = type;
	container.dataset.id = id;

	container.innerHTML = `        
        <div class="unit-toolbar">
            <button>
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>
            </button>
            <button class="card-edit">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
            </button>
            <button class="card-delete">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
            </button>
        </div>        
        <button class='forward-button'>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
        </button>
        <div class="unit-info">
            <p class="unit-title">${title}</p>
            <p class="unit-description">${description}</p>
            <p class="unit-createdAt">${dateToYYYYMMDD(new Date(createdAt))}</p>
            <div class="module-info">
                <p>${cards.length} card${addPlural(cards.length)}</p>
            </div>
        </div>
    `;
	setElUnitListener(container, id);
	return container;
}

function getElCards(cards) {
	const container = document.createElement("div");
	container.classList.add("cards-container");
	cards.forEach((card) => {
		container.appendChild(getElCard(card));
	});
	return container;
}

function getElCard(card) {
	const { id, type, card_type, level, createdAt } = card;
	const container = document.createElement("div");

	container.classList.add("library-card");
	container.dataset.type = type;
	container.dataset.id = id;

	// THIS CAN BE IMPROVED TO MAKE IT MORE EASY TO MAINTAIN
	// BY MAKING IT MODULAR
	switch (card_type) {
		case "flashcard":
			const { front, back } = card;
			container.classList.add("library-flashcard");

			container.innerHTML = `
                <div class="library-card-toolbar">
                    <button class="card-edit">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
                    </button>
                    <button class="card-delete">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                    </button>
                </div>                
                <div class="library-card-info">
                    <p>${front}</p>
                    <p>${back}</p>
                    <div>
                        <span class="library-card-createdAt">${dateToYYYYMMDD(new Date(createdAt))}</span>
                        <span class="library-card-level">Level ${level}</span>
                    </div>
                </div>
            `;
			break;
		case "truefalse":
			break;
		case "identification":
			break;
		case "multiple":
			break;
	}

	return container;
}

function dateToYYYYMMDD(date, divider) {
	divider = divider ?? "-";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}${divider}${month}${divider}${day}`;
}

init();
