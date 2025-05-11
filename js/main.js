import { STORAGE_STRUCT, ELEMENTS, storage, local } from "./utilities/global.js";
import { renderElLibrary, setElLibraryListener } from "./library/library.js";
import { renderElSession, setElSessionlistener } from "./session/session.js";
import { setCards } from "./session/session.js";
import { setElSettingsListener } from "./settings/settings.js";
import { setElRulesListener, renderElRules } from "./rules/rules.js";
import { setElSelectListener } from "./generate/generate.js";

// These functions should be in utilities
function popup_mode() {
	if (location.search.includes("popup=true")) {
		document.documentElement.style = "width: 800px; height: 500px";
	}
}

function init_default_listeners() {
	setElSettingsListener();
	setElLibraryListener();
	setElSelectListener();
	setElSessionlistener();
	setElRulesListener();
}

async function init_user_data() {
	const user_data = await local.get(null);

	if (!Object.keys(user_data).length) {
		await local.set(STORAGE_STRUCT);
		return STORAGE_STRUCT;
	}
	return user_data;
}

async function init() {
	popup_mode();
	init_default_listeners();

	const user_data = await init_user_data();

	setCards(user_data);

	renderElRules(user_data);
	renderElLibrary(user_data, -1, -1);
	renderElSession(); // Depends on local variables

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

		renderElRules(userdata);
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

init();
