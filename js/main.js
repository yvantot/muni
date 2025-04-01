// === main.js === //

import { STORAGE_STRUCT, ELEMENTS, storage, local } from "./utilities/global.js";
import { renderElLibrary } from "./library/library.js";
import { renderElSession } from "./session/session.js";
import { getIndexes, getMaxNumber } from "./utilities/utilities.js";
import { setCards } from "./session/session.js";

async function init() {
	// On start
	initListeners();

	let userdata = await local.get(null);
	if (Object.keys(userdata).length === 0) {
		userdata = STORAGE_STRUCT;
		await local.set(STORAGE_STRUCT);
	}

	setCards(userdata);

	renderElLibrary(userdata, -1, -1); // Render library
	renderElSession(); // Render session

	// On storage change
	storage.onChanged.addListener(update);
}

async function update() {
	let userdata = await local.get(null);

	if (userdata.reason === "") {
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

		renderElSession(); // Render session
		// END
	} else {
		if (userdata.reason === "update-card-structure") {
			setCards(userdata); // Update the temporary cards
			renderElSession(); // Render session
		}
	}

	userdata.reason = "";
	await local.set(userdata);
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
		const moduleId = LIBRARY_CONTENTS.dataset.moduleId;
		const unitId = LIBRARY_CONTENTS.dataset.unitId;
		const { moduleIndex, unitIndex } = getIndexes(userdata, moduleId, unitId);

		if (currentNav === "units") {
			// Add new `unit`
			let id = getMaxNumber(userdata.modules[moduleIndex].units.map((unit) => unit.id));
			if (userdata.modules[moduleIndex].units.length !== 0) id += 1; // If 0, then 0 otherwise +1

			userdata.modules[moduleIndex].units.push({
				id,
				type: "unit",
				title: "",
				description: "",

				isEditing: true,
				createdAt: String(new Date()),
				isActive: true,
				cards: [],
			});

			await local.set(userdata);
		} else if (currentNav === "cards") {
			// Add new card
			let id = getMaxNumber(userdata.modules[moduleIndex].units[unitIndex].cards.map((card) => card.id));
			if (userdata.modules[moduleIndex].units[unitIndex].cards.length !== 0) id += 1;

			userdata.reason = "update-card-structure";
			userdata.modules[moduleIndex].units[unitIndex].cards.push({
				id,
				type: "card",
				card_type: "flashcard",
				level: 1,
				createdAt: String(new Date()),

				isEditing: true,
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
				isEditing: true,
				units: [],
			});

			await local.set(userdata);
		}
	});
}

init();
