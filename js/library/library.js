import { ELEMENTS, local } from "../utilities/global.js";
import { cutString, getIndexes, getLatestId } from "../utilities/utilities.js";
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

		if (currentNav === "units") {
			// Add new `unit`
			const { moduleIndex } = getIndexes(userdata, moduleId);
			let id = getLatestId(userdata.modules[moduleIndex].units);

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
			const unitId = LIBRARY_CONTENTS.dataset.unitId;
			const { moduleIndex, unitIndex } = getIndexes(userdata, moduleId, unitId);
			let id = getLatestId(userdata.modules[moduleIndex].units[unitIndex].cards);

			const card_module = userdata.modules[moduleIndex];
			const card_unit = userdata.modules[moduleIndex].units[unitIndex];

			userdata.modules[moduleIndex].units[unitIndex].cards.push({
				id,
				type: "card",
				card_type: "flashcard",
				level: 1,
				createdAt: String(new Date()),
				isActive: card_module.isActive && card_unit.isActive,
				isEditing: true,

				moduleTitle: card_module.title,
				moduleId: card_module.id,
				unitTitle: card_unit.title,
				unitId: card_unit.id,

				front: "",
				back: "",
				keyword: "",
				hint: "",
			});

			userdata.reason = "update-card-structure";
			await local.set(userdata);
		} else {
			// Add new module
			let id = getLatestId(userdata.modules);

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
