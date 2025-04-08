const BUTTONS = {
	LIBRARY: document.getElementById("library-feature"),
	STATISTIC: document.getElementById("statistic-feature"),
	RULES: document.getElementById("rules-feature"),
	AI: document.getElementById("ai-feature"),
	SETTINGS: document.getElementById("settings-feature"),
};

const SECTIONS = {
	LIBRARY: document.getElementById("main-library"),
	STATISTIC: document.getElementById("main-statistic"),
	RULES: document.getElementById("main-rules"),
	AI: document.getElementById("main-ai"),
	SETTINGS: document.getElementById("main-usersettings"),
};

export function setElSettingsListener() {
	const { LIBRARY, STATISTIC, RULES, AI, SETTINGS } = BUTTONS;

	LIBRARY.addEventListener("click", () => {
		toggleDisplay(SECTIONS.LIBRARY, LIBRARY);
	});

	STATISTIC.addEventListener("click", () => {
		toggleDisplay(SECTIONS.STATISTIC, STATISTIC);
	});

	RULES.addEventListener("click", () => {
		toggleDisplay(SECTIONS.RULES, RULES);
	});

	AI.addEventListener("click", () => {
		toggleDisplay(SECTIONS.AI, AI);
	});

	SETTINGS.addEventListener("click", () => {
		toggleDisplay(SECTIONS.SETTINGS, SETTINGS);
	});
}

function toggleDisplay(section, button) {
	if (!section.classList.contains("no-display")) {
		button.classList.toggle("visiting-feature");
		section.classList.toggle("no-display");
		return;
	}
	for (let key of Object.keys(SECTIONS)) {
		BUTTONS[key].classList.remove("visiting-feature");
		SECTIONS[key].classList.add("no-display");
	}
	button.classList.add("visiting-feature");
	section.classList.remove("no-display");
}
