import { local } from "../utilities/global.js";
import { getIndexes, getMaxNumber, getLatestId } from "../utilities/utilities.js";

const SELECTS = {
	SELECT_MODULE: document.getElementById("select-module"),
	SELECT_UNIT: document.getElementById("select-unit"),
	SELECT_METHOD: document.getElementById("select-method"),
};

const GENERATE = {
	BUTTON: document.getElementById("generate-card"),
	INPUT: document.getElementById("generate-input"),
};

export function renderElSelectModule(userdata) {
	const { modules } = userdata;
	if (!modules) return;

	const { SELECT_MODULE, SELECT_UNIT } = SELECTS;

	const fragment = document.createDocumentFragment();

	const option = document.createElement("option");
	option.textContent = "New";
	fragment.appendChild(option);

	const option2 = document.createElement("option");
	option2.textContent = "New";

	modules.forEach((module, i) => {
		const option = document.createElement("option");
		option.dataset.value = module.id;
		option.textContent = module.title;
		fragment.appendChild(option);
	});

	SELECT_MODULE.innerHTML = "";
	SELECT_UNIT.innerHTML = "";
	SELECT_MODULE.append(fragment);
	SELECT_UNIT.appendChild(option2);
}

export function setElSelectListener() {
	const { SELECT_MODULE, SELECT_UNIT } = SELECTS;
	const { BUTTON, INPUT } = GENERATE;

	SELECT_MODULE.addEventListener("change", async () => {
		const userdata = await local.get(null);
		const moduleId = SELECT_MODULE.options[SELECT_MODULE.selectedIndex].dataset?.value;

		const fragment = document.createDocumentFragment();

		// If the module has no units
		const option = document.createElement("option");
		option.textContent = "New";
		fragment.appendChild(option);

		if (moduleId !== undefined) {
			const { moduleIndex } = getIndexes(userdata, moduleId);
			userdata.modules[moduleIndex].units.forEach((unit, i) => {
				const option = document.createElement("option");
				option.dataset.value = unit.id;
				option.textContent = unit.title;
				fragment.appendChild(option);
			});
		}

		SELECT_UNIT.innerHTML = "";
		SELECT_UNIT.append(fragment);
	});

	BUTTON.addEventListener("click", async () => {
		// New module & new unit

		// Have module & new unit
		// Have module & have unit

		// No matches handle
		const userdata = await local.get(null);
		const { modules } = userdata;

		const regex = /-q\s+([\s\S]*?)-a\s+([\s\S]*?)(?=\s*-q\s+|\s*$)/gi;
		const str = INPUT.innerText;
		const matches = str.matchAll(regex);

		const newCards = [];
		matches.forEach((match, i) => {
			newCards.push({
				id: i,
				type: "card",
				card_type: "flashcard",
				level: 1,
				createdAt: String(new Date()),

				isEditing: false,
				front: match[1],
				back: match[2],
			});
		});

		const newModule = {
			id: 0,
			type: "module",
			title: "Module",
			description: "This module is generated with Muni Note",

			author: "Author",
			createdAt: String(new Date()),
			isActive: true,
			isEditing: false,
			units: [
				{
					id: 0,
					type: "unit",
					title: "Unit ",
					description: "This unit is generated with Muni Note",

					createdAt: String(new Date()),
					isActive: true,
					isEditing: false,
					cards: newCards,
				},
			],
		};

		const moduleId = SELECT_MODULE.options[SELECT_MODULE.selectedIndex].dataset?.value;
		const unitId = SELECT_UNIT.options[SELECT_UNIT.selectedIndex].dataset?.value;

		if (moduleId === undefined) {
			// Add new module
			const id = getLatestId(modules);

			newModule.id = id;
			newModule.title += " " + id;

			modules.push(newModule);
		} else if (moduleId >= 0 && unitId === undefined) {
			// Add new unit to a module
			const { moduleIndex } = getIndexes(userdata, moduleId);
			const id = getLatestId(modules[moduleIndex].units);

			const newUnit = newModule.units[0];
			newUnit.id = id;
			newUnit.title += " " + id;

			modules[moduleIndex].units.push(newUnit);
		} else if (moduleId >= 0 && unitId >= 0) {
			// Add new cards to exisiting units
			const { moduleIndex, unitIndex } = getIndexes(userdata, moduleId, unitId);
			let id = getLatestId(modules[moduleIndex].units[unitIndex].cards);

			newCards.forEach((card) => {
				card.id = id;
				id += 1;
			});

			modules[moduleIndex].units[unitIndex].cards.push(...newCards);
		}

		await local.set({
			reason: "update-card-structure",
			modules,
		});
	});
}
