import { ELEMENTS, local } from "../utilities/global.js";
import { cutString, getIndexes, getMaxNumber } from "../utilities/utilities.js";
import { getElModules } from "./modules.js";
import { getElUnits } from "./units.js";
import { getElCards } from "./cards.js";

export function setElLibraryListener() {
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

export function renderElLibrary(userdata, moduleId, unitId) {
	const { LIBRARY_CONTENTS, LIBRARY_CURRENT, LIBRARY_CURRENT_TITLE } = ELEMENTS;
	LIBRARY_CONTENTS.innerHTML = "";

	const currentNav = LIBRARY_CONTENTS.dataset.currentNav;
	LIBRARY_CURRENT.textContent = `${currentNav[0].toUpperCase() + currentNav.slice(1)}`;

	const { modules } = userdata;
	if (!modules) return;

	const { moduleIndex } = getIndexes(userdata, moduleId);

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
