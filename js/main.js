// === main.js === //
// datasets always return 'strings'
// don't use 'id' for indexing

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

async function update() {
	let userdata = await local.get(null);

	const currentNav = ELEMENTS.LIBRARY_CONTENTS.dataset.currentNav;
	const moduleId = parseInt(ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId);
	const unitId = parseInt(ELEMENTS.LIBRARY_CONTENTS.dataset.unitId);

	if (currentNav === "modules") {
		renderElLibrary(userdata, -1, -1);
	} else if (currentNav === "units") {
		renderElLibrary(userdata, moduleId, -1);
	} else if (currentNav === "cards") {
		renderElLibrary(userdata, moduleId, unitId);
	}
}

function initListeners() {
	const { LIBRARY_CONTENTS, LIBRARY_BACK, LIBRARY_ADD } = ELEMENTS;

	LIBRARY_BACK.addEventListener("click", async () => {
		const userdata = await local.get(null);

		const currentNav = LIBRARY_CONTENTS.dataset.currentNav;
		const moduleId = parseInt(LIBRARY_CONTENTS.dataset.moduleId);

		if (currentNav === "units") {
			LIBRARY_CONTENTS.dataset.currentNav = "modules";
			renderElLibrary(userdata, -1, -1);
		} else if (currentNav === "cards") {
			LIBRARY_CONTENTS.dataset.currentNav = "units";
			renderElLibrary(userdata, moduleId, -1);
		}
	});

	LIBRARY_ADD.addEventListener("click", async () => {
		const userdata = await local.get(null);

		const currentNav = LIBRARY_CONTENTS.dataset.currentNav;
		const moduleId = parseInt(LIBRARY_CONTENTS.dataset.moduleId);
		const unitId = parseInt(LIBRARY_CONTENTS.dataset.unitId);
		const moduleIndex = userdata.modules.findIndex((module) => module.id === moduleId);

		if (currentNav === "units") {
			// Add new unit
			let id = getMaxNumber(userdata.modules[moduleIndex].units.map((unit) => unit.id));
			if (userdata.modules[moduleIndex].units.length !== 0) id += 1; // If 0, then 0 otherwise +1

			userdata.modules[moduleIndex].units.push({
				id,
				type: "unit",
				title: "",
				description: "",

				createdAt: String(new Date()),
				isActive: true,
				cards: [],
			});

			await local.set(userdata);
		} else if (currentNav === "cards") {
			// Add new card
			const unitIndex = userdata.modules[moduleIndex].units.findIndex((unit) => unit.id === unitId);
			let id = getMaxNumber(userdata.modules[moduleIndex].units[unitIndex].cards.map((card) => card.id));
			if (userdata.modules[moduleIndex].units[unitIndex].cards.length !== 0) id += 1;

			userdata.modules[moduleIndex].units[unitIndex].cards.push({
				id,
				type: "card",
				card_type: "flashcard",
				level: 0,
				createdAt: String(new Date()),

				front: "",
				back: "",
			});

			await local.set(userdata);
		} else {
			// Add new module
			let id = getMaxNumber(userdata.modules.map((module) => module.id));
			if (userdata.modules.length !== 0) id += 1;

			userdata.modules.push({
				id,
				type: "module",
				title: "",
				description: "",

				author: "",
				createdAt: String(new Date()),
				isActive: true,
				units: [],
			});

			await local.set(userdata);
		}
	});
}

function renderElLibrary(userdata, moduleId, unitId) {
	const { LIBRARY_CONTENTS, LIBRARY_CURRENT, LIBRARY_CURRENT_TITLE } = ELEMENTS;
	LIBRARY_CONTENTS.innerHTML = "";

	const currentNav = LIBRARY_CONTENTS.dataset.currentNav;
	LIBRARY_CURRENT.textContent = `${currentNav[0].toUpperCase() + currentNav.slice(1)}`;

	const { modules } = userdata;
	const moduleIndex = modules.findIndex((module) => module.id === moduleId);

	if (moduleId === -1 && unitId === -1) {
		// Render modules
		LIBRARY_CURRENT_TITLE.textContent = `Home`;
		LIBRARY_CONTENTS.appendChild(getElModules(modules));
	} else if (moduleId >= 0 && unitId === -1) {
		// Render units
		LIBRARY_CURRENT_TITLE.textContent = `Home > ${cutString(userdata.modules[moduleIndex].title)}`; // Changing the library path info

		LIBRARY_CONTENTS.appendChild(getElUnits(modules[moduleIndex].units));
	} else if (moduleId >= 0 && unitId >= 0) {
		// Render cards
		const unitIndex = modules[moduleIndex].units.findIndex((unit) => unit.id === unitId);
		LIBRARY_CURRENT_TITLE.textContent = `Home > ${cutString(userdata.modules[moduleIndex].title)} > ${cutString(userdata.modules[moduleIndex].units[unitIndex].title)}`;

		LIBRARY_CONTENTS.appendChild(getElCards(modules[moduleIndex].units[unitIndex].cards));
	}
}

function getElModule(module) {
	const { id, type, title, description, author, createdAt, isActive, units, isEditing } = module;

	const unitsCount = units.length;
	const cardsCount = getCardsCount(units);
	const container = document.createElement("div");
	const isEditingInfo = isEmptyStr(title) || isEmptyStr(description) || isEditing;

	// Classes
	if (!isActive) container.classList.add("not-active");
	container.classList.add("module");
	container.dataset.id = id;

	container.innerHTML = `
        <div class="module-toolbar">
            <button class="active-button">            
                ${isActive ? '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M360-320h80v-320h-80v320Zm160 0h80v-320h-80v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>'}                
            </button>
            ${isEditingInfo === false ? '<button class="edit-info"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg></button>' : ""}            
            <button class="delete">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
            </button>
        </div>
        <button class='forward-button'>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
        </button>                
        ${isEditingInfo ? '<button class="edit-button"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg></button>' : ""}
        <div class="module-info">
            <p contentEditable="${isEditingInfo ? "true" : "false"}" class="module-title ${isEditingInfo ? "editing" : ""}">${isEmptyStr(title) ? "Title" : title}</p>
            <p contentEditable="${isEditingInfo ? "true" : "false"}" class="module-description ${isEditingInfo ? "editing" : ""}">${isEmptyStr(description) ? "Description" : description}</p>
            <p class="module-createdAt">${dateToYYYYMMDD(new Date(createdAt))}</p>
            <div class="module-info">
                <p contentEditable="${isEditingInfo ? "true" : "false"}" class="module-author ${isEditingInfo ? "editing" : ""}">${isEmptyStr(author) ? "Author" : author}</p>
                <p>${unitsCount} unit${addPlural(unitsCount)} - ${cardsCount} card${addPlural(cardsCount)}</p>
            </div>
        </div>
    `;
	setElModuleListener(container, id, isEditingInfo);
	return container;
}

function getElModules(modules) {
	const container = document.createElement("div");
	container.classList.add("modules-container");
	modules.forEach((module) => {
		container.appendChild(getElModule(module));
	});
	return container;
}

function setElModuleListener(container, moduleId, isEditingInfo) {
	// Edit
	if (isEditingInfo) {
		container.querySelector(".edit-button").addEventListener("click", async () => {
			const description = container.querySelector(".module-description");
			const title = container.querySelector(".module-title");
			const author = container.querySelector(".module-author");

			if (isEmptyStr(description.innerText) || isEmptyStr(title.innerText) || isEmptyStr(author.innerText)) {
				alert("Please finish editing");
			} else {
				const userdata = await local.get(null);
				const moduleIndex = userdata.modules.findIndex((module) => module.id === moduleId);

				userdata.modules[moduleIndex].isEditing = false;
				userdata.modules[moduleIndex].title = title.innerText;
				userdata.modules[moduleIndex].description = description.innerText;
				userdata.modules[moduleIndex].author = author.innerText;

				await local.set(userdata);
			}
		});
	}

	// Delete
	container.querySelector(".delete").addEventListener("click", async () => {
		const userdata = await local.get(null);

		const moduleIndex = userdata.modules.findIndex((module) => module.id === moduleId);
		userdata.modules.splice(moduleIndex, 1);

		await local.set(userdata);
	});

	// Forward
	container.querySelector(".forward-button").addEventListener("click", async () => {
		if (isEditingInfo) return;

		const userdata = await local.get(null);
		ELEMENTS.LIBRARY_CONTENTS.dataset.currentNav = "units";
		ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId = moduleId;
		renderElLibrary(userdata, moduleId, -1);
	});

	// Active
	container.querySelector(".active-button").addEventListener("click", async () => {
		const userdata = await local.get(null);
		const moduleIndex = userdata.modules.findIndex((module) => module.id === moduleId);
		userdata.modules[moduleIndex].isActive = !userdata.modules[moduleIndex].isActive;
		await local.set(userdata);
	});

	// Edit
	const editBtn = container.querySelector(".edit-info");
	if (editBtn) {
		editBtn.addEventListener("click", async () => {
			const userdata = await local.get(null);
			const moduleIndex = userdata.modules.findIndex((module) => module.id === moduleId);
			userdata.modules[moduleIndex].isEditing = !userdata.modules[moduleIndex].isEditing;
			await local.set(userdata);
		});
	}
}

function getElUnit(unit) {
	const { id, type, title, description, createdAt, isActive, cards, isEditing } = unit;

	const container = document.createElement("div");
	const isEditingInfo = isEmptyStr(title) || isEmptyStr(description) || isEditing;

	if (!isActive) container.classList.add("not-active");
	container.classList.add("unit");
	container.dataset.type = type;
	container.dataset.id = id;

	container.innerHTML = `        
        <div class="unit-toolbar">
            <button class="active-button">
            ${isActive ? '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M360-320h80v-320h-80v320Zm160 0h80v-320h-80v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>'}
            </button>
            <button class="edit-info">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
            </button>
            <button class="delete">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
            </button>
        </div>        
        <button class='forward-button'>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
        </button>
        ${isEditingInfo ? '<button class="edit-button"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg></button>' : ""}
        <div class="unit-info">
            <p contentEditable="${isEditingInfo ? "true" : "false"}" class="unit-title ${isEditingInfo ? "editing" : ""}">${isEmptyStr(title) ? "Title" : title}</p>
            <p contentEditable="${isEditingInfo ? "true" : "false"}" class="unit-description ${isEditingInfo ? "editing" : ""}">${isEmptyStr(description) ? "Description" : description}</p>
            <p class="unit-createdAt">${dateToYYYYMMDD(new Date(createdAt))}</p>
            <div class="module-info">
                <p>${cards.length} card${addPlural(cards.length)}</p>
            </div>
        </div>
    `;
	setElUnitListener(container, id, isEditingInfo);
	return container;
}

function getElUnits(units) {
	const container = document.createElement("div");
	container.classList.add("units-container");
	units.forEach((unit) => {
		container.appendChild(getElUnit(unit));
	});
	return container;
}

// REWRITE LEFT HERE

function setElUnitListener(container, id, isEditingInfo) {
	if (isEditingInfo) {
		container.querySelector(".edit-button").addEventListener("click", async () => {
			const description = container.querySelector(".unit-description");
			const title = container.querySelector(".unit-title");
			if (isEmptyStr(description.innerText) || isEmptyStr(title.innerText)) {
				alert("Please finish editing");
			} else {
				const userdata = await local.get(null);
				const moduleId = ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId;
				let moduleIndex = userdata.modules.findIndex((module) => moduleId === module.id);
				const unitIndex = userdata.modules[moduleIndex].units.findIndex((unit) => unit.id === id);
				userdata.modules[moduleIndex].units[id].title = title.innerText;
				userdata.modules[unitIndex].units[id].description = description.innerText;
				await local.set(userdata);
			}
		});
	}

	const deleteBtn = container.querySelector(".delete");
	deleteBtn.addEventListener("click", async () => {
		const userdata = await local.get(null);
		const moduleId = ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId;
		let moduleIndex = userdata.modules.findIndex((module) => moduleId === module.id);
		const unitIndex = userdata.modules[moduleIndex].units.findIndex((unit) => unit.id === id);
		userdata.modules[moduleIndex].units.splice(unitIndex, 1);
		await local.set(userdata);
	});

	const forward = container.querySelector(".forward-button");
	forward.addEventListener("click", async () => {
		if (isEditingInfo) {
			alert("Please finish editing");
			return;
		}
		const userdata = await local.get(null);

		const moduleId = ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId;
		ELEMENTS.LIBRARY_CONTENTS.dataset.currentNav = "cards";
		ELEMENTS.LIBRARY_CONTENTS.dataset.unitId = id;
		renderElLibrary(userdata, moduleId, id);
	});

	const activeBtn = container.querySelector(".active-button");
	activeBtn.addEventListener("click", async () => {
		const userdata = await local.get(null);
		const moduleId = ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId;
		let moduleIndex = userdata.modules.findIndex((module) => moduleId === module.id);
		const unitIndex = userdata.modules[moduleIndex].units.findIndex((unit) => unit.id === id);
		userdata.modules[moduleIndex].units[unitIndex].isActive = !userdata.modules[moduleIndex].units[unitIndex].isActive;
		await local.set(userdata);
	});

	const editBtn = container.querySelector(".edit-info");
	editBtn.addEventListener("click", () => {
		alert(1);
	});
}

function setElCardListener(container, id, isEditingInfo) {
	if (isEditingInfo) {
		const confirmEdit = container.querySelector(".edit-button");

		confirmEdit.addEventListener("click", async () => {
			const front = container.querySelector(".front");
			const back = container.querySelector(".back");
			if (isEmptyStr(front.innerText) || isEmptyStr(back.innerText)) {
				alert("Please finish editing");
			} else {
				const userdata = await local.get(null);
				const moduleId = ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId;
				const unitId = ELEMENTS.LIBRARY_CONTENTS.dataset.unitId;
				const moduleIndex = userdata.modules.findIndex((module) => moduleId === module.id);
				const unitIndex = userdata.modules[moduleIndex].units.findIndex((unit) => unit.id === unitId);
				const cardIndex = userdata.modules[moduleIndex].units[unitIndex].cards.findIndex((card) => card.id === id);
				userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].front = front.innerText;
				userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].back = back.innerText;
				await local.set(userdata);
			}
		});
	}

	const deleteBtn = container.querySelector(".delete");
	deleteBtn.addEventListener("click", async () => {
		const userdata = await local.get(null);
		const moduleId = ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId;
		const unitId = ELEMENTS.LIBRARY_CONTENTS.dataset.unitId;
		const moduleIndex = userdata.modules.findIndex((module) => moduleId === module.id);
		const unitIndex = userdata.modules[moduleIndex].units.findIndex((unit) => unit.id === unitId);
		const cardIndex = userdata.modules[moduleIndex].units[unitIndex].cards.findIndex((card) => card.id === id);
		userdata.modules[moduleIndex].units[unitIndex].cards.splice(cardIndex, 1);
		await local.set(userdata);
	});
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
	const { id, type, card_type, level, createdAt, isEditing } = card;
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
			const isEditingInfo = isEmptyStr(front) || isEmptyStr(back) || isEditing;

			container.innerHTML = `
                <div class="library-card-toolbar">
                    <button class="edit-info">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
                    </button>
                    <button class="delete">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                    </button>
                </div>                
                ${isEditingInfo ? '<button class="edit-button"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg></button>' : ""}
                <div class="library-card-info">
                    <p contentEditable="${isEditingInfo ? "true" : "false"}" class="front ${isEmptyStr(front) ? "editing" : ""}">${isEmptyStr(front) ? "Front" : front}</p>
                    <p contentEditable="${isEditingInfo ? "true" : "false"}" class="back ${isEmptyStr(back) ? "editing" : ""}">${isEmptyStr(back) ? "Back" : back}</p>
                    <div>
                        <span class="library-card-createdAt">${dateToYYYYMMDD(new Date(createdAt))}</span>
                        <span class="library-card-level">Level ${level}</span>
                    </div>
                </div>
            `;

			setElCardListener(container, id, isEditingInfo);
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

function getMaxNumber(arr) {
	if (arr.length === 0) return 0;

	let max = arr[0];
	for (let i = 1; i < arr.length; i++) {
		if (arr[i] > max) max = arr[i];
	}
	return max;
}

function cutString(str, length = 7) {
	if (isEmptyStr(str)) return "..";
	return str.length > length ? str.slice(0, length) + ".." : str;
}

function isEmptyStr(str) {
	return str.trim().length === 0;
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
init();
