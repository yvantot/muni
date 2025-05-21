import { local } from "../utilities/global.js";

const ELEMENTS = {
	BTN_KEYWORD: document.getElementById("show-keyword"),
	DESC_KEYWORD: document.getElementById("is-show-keyword"),
	BTN_WHITELIST: document.getElementById("popup-whitelist-set"),
	BTN_INTERVAL: document.getElementById("popup-time-set"),
	INP_WHITELIST: document.getElementById("popup-whitelist-input"),
	INP_INTERVAL: document.getElementById("popup-time-input"),
	SHORT_TERM_MODE: document.getElementById("short-term-learning"),
	LONG_TERM_MODE: document.getElementById("long-term-learning"),
};

export function renderElRules(userdata) {
	const { INP_WHITELIST, INP_INTERVAL, DESC_KEYWORD, SHORT_TERM_MODE, LONG_TERM_MODE } = ELEMENTS;
	const { settings } = userdata;
	//INP_WHITELIST.innerText = "";
	INP_INTERVAL.innerText = (settings.rules.intervalMs / (60 * 1000)).toFixed(1);

	if (settings.rules.learning_mode === "short") {
		SHORT_TERM_MODE.checked = true;
	} else {
		LONG_TERM_MODE.checked = true;
	}

	const is_show_keyword = settings.rules.show_keyword;
	if (is_show_keyword) {
		DESC_KEYWORD.innerText = "Enabled";
		DESC_KEYWORD.dataset.enabled = is_show_keyword ? 1 : 0;
	} else {
		DESC_KEYWORD.innerText = "Disabled";
		DESC_KEYWORD.dataset.enabled = is_show_keyword ? 1 : 0;
	}
}

export function setElRulesListener() {
	const { BTN_WHITELIST, BTN_INTERVAL, BTN_KEYWORD, INP_WHITELIST, INP_INTERVAL, SHORT_TERM_MODE, LONG_TERM_MODE } = ELEMENTS;

	BTN_KEYWORD.addEventListener("click", async () => {
		const { settings } = await local.get("settings");
		settings.rules.show_keyword = !settings.rules.show_keyword;
		await local.set({ settings });
	});

	SHORT_TERM_MODE.addEventListener("click", async () => {
		const { settings } = await local.get("settings");
		settings.rules.learning_mode = "short";
		await local.set({ settings });
	});

	LONG_TERM_MODE.addEventListener("click", async () => {
		const { settings } = await local.get("settings");
		settings.rules.learning_mode = "long";
		await local.set({ settings });
	});

	BTN_INTERVAL.addEventListener("click", async () => {
		const { innerText } = INP_INTERVAL;
		const sanitizeRegExp = /^[\d]+\.?[\d]*$/;
		if (sanitizeRegExp.test(innerText)) {
			const { settings } = await local.get("settings");
			settings.rules.intervalMs = parseFloat(innerText) * (60 * 1000);
			await local.set({ settings });
		}
	});
}
