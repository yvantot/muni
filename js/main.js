// === main.js === //

import { STORAGE_STRUCT, ELEMENTS, storage, local } from "./utilities/global.js";
import { renderElLibrary, setElLibraryListener } from "./library/library.js";
import { renderElSession, setElSessionlistener, updateElCardLevels } from "./session/session.js";
import { setCards } from "./session/session.js";
import { setElSettingsListener } from "./settings/settings.js";
import { renderElSelectModule, setElSelectListener } from "./generate/generate.js";

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
	renderElSelectModule(userdata);
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

		renderElSelectModule(userdata);
		renderElSession(); // Render session

		// END
	} else {
		if (userdata.reason === "update-card-structure") {
			setCards(userdata); // Update the temporary cards
			renderElSession(); // Render session
		}
	}

	// This is to avoid local.clear(); nasty logic
	if (Object.keys(userdata).length !== 0) userdata.reason = "";
	await local.set(userdata);
}

function initListeners() {
	setElSettingsListener();
	setElLibraryListener();
	setElSelectListener();
	setElSessionlistener();
}

init();
