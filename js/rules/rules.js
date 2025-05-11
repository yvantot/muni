import { local } from "../utilities/global.js";

const ELEMENTS = {
	BTN_KEYWORD: document.getElementById("show-keyword"),
	DESC_KEYWORD: document.getElementById("is-show-keyword"),
	BTN_WHITELIST: document.getElementById("popup-whitelist-set"),
	BTN_INTERVAL: document.getElementById("popup-time-set"),
	INP_WHITELIST: document.getElementById("popup-whitelist-input"),
	INP_INTERVAL: document.getElementById("popup-time-input"),
};

export function renderElRules(userdata) {
	const { INP_WHITELIST, INP_INTERVAL, DESC_KEYWORD } = ELEMENTS;
	const { settings } = userdata;
	//INP_WHITELIST.innerText = "";
	INP_INTERVAL.innerText = (settings.rules.intervalMs / (60 * 1000)).toFixed(1);

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
	const { BTN_WHITELIST, BTN_INTERVAL, BTN_KEYWORD, INP_WHITELIST, INP_INTERVAL } = ELEMENTS;

	BTN_KEYWORD.addEventListener("click", async () => {
		const { settings } = await local.get("settings");
		settings.rules.show_keyword = !settings.rules.show_keyword;
		await local.set({ settings });
	});

	BTN_WHITELIST.addEventListener("click", () => {});

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
