import { ELEMENTS } from "../utilities/global.js";
import { cutString, getIndexes } from "../utilities/utilities.js";
import { getElModules } from "./modules.js";
import { getElUnits } from "./units.js";
import { getElCards } from "./cards.js";

export function renderElLibrary(userdata, moduleId, unitId) {
	const { LIBRARY_CONTENTS, LIBRARY_CURRENT, LIBRARY_CURRENT_TITLE } = ELEMENTS;
	LIBRARY_CONTENTS.innerHTML = "";

	const currentNav = LIBRARY_CONTENTS.dataset.currentNav;
	LIBRARY_CURRENT.textContent = `${currentNav[0].toUpperCase() + currentNav.slice(1)}`;

	const { modules } = userdata;
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
