import { local } from "../utilities/global.js";
import { show_popup, decode_b64, encode_b64, getLatestId } from "../utilities/utilities.js";

const BUTTONS = {
	LIBRARY: document.getElementById("library-feature"),
	STATISTIC: document.getElementById("statistic-feature"),
	RULES: document.getElementById("rules-feature"),
	AI: document.getElementById("ai-feature"),
	SETTINGS: document.getElementById("settings-feature"),
	CREATE_ACCOUNT: document.getElementById("account-create"),
	LOGIN_ACCOUNT: document.getElementById("account-login"),
	SYNC_ACCOUNT: document.getElementById("account-sync"),
	IMPORT_MODULE: document.getElementById("module-import"),
};

const INPUTS = {
	USERNAME_CREATE: document.getElementById("username-create"),
	PASSWORD_CREATE: document.getElementById("password-create"),
	USERNAME_LOGIN: document.getElementById("username-login"),
	PASSWORD_LOGIN: document.getElementById("password-login"),
	USERNAME_SYNC: document.getElementById("username-sync"),
	PASSWORD_SYNC: document.getElementById("password-sync"),
	MODULE_FILE: document.getElementById("module-file"),
};

const SECTIONS = {
	LIBRARY: document.getElementById("main-library"),
	STATISTIC: document.getElementById("main-statistic"),
	RULES: document.getElementById("main-rules"),
	AI: document.getElementById("main-ai"),
	SETTINGS: document.getElementById("main-usersettings"),
};

export function setElSettingsListener() {
	const { LIBRARY, STATISTIC, RULES, AI, SETTINGS, CREATE_ACCOUNT, LOGIN_ACCOUNT, SYNC_ACCOUNT, IMPORT_MODULE } = BUTTONS;
	const { MODULE_FILE } = INPUTS;

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

	MODULE_FILE.addEventListener("change", () => {});

	IMPORT_MODULE.addEventListener("click", async () => {
		const { MODULE_FILE } = INPUTS;
		const { modules } = await local.get(null);

		const files = MODULE_FILE.files;

		if (files.length) {
			for (const file of files) {
				const reader = new FileReader();
				reader.readAsText(file);

				reader.onload = async () => {
					const module = JSON.parse(decode_b64(reader.result));
					module.id = getLatestId(modules);
					modules.push(module);
					show_popup(`Successfully added '${module.title}' to library`);
					await local.set({ modules });
				};
			}
		}
	});

	SYNC_ACCOUNT.addEventListener("click", async () => {
		const { USERNAME_SYNC, PASSWORD_SYNC } = INPUTS;
		const username = USERNAME_SYNC.value;
		const password = PASSWORD_SYNC.value;
		const data = encode_b64(JSON.stringify(await local.get(null)));

		fetch("http://localhost:3000/sync", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password, data }),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					console.log(data.error);
				} else {
					console.log("Success");
				}
			});
	});

	CREATE_ACCOUNT.addEventListener("click", async () => {
		const { USERNAME_CREATE, PASSWORD_CREATE } = INPUTS;
		const username = USERNAME_CREATE.value;
		const password = PASSWORD_CREATE.value;
		const data = encode_b64(JSON.stringify(await local.get(null)));

		fetch("http://localhost:3000/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password, data }),
		})
			.then((res) => res.json())
			.then((data) => {
				if (data.error) {
					show_popup(data.error, "Okay", { bg: "hsl(0, 30.20%, 50.00%)", svg_icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>' });
				} else {
					show_popup(`Successfully created an account. Your username is ${username}`, "Okay", { bg: "hsl(128, 30.20%, 50.00%)", svg_icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>' });
				}
			});
	});

	LOGIN_ACCOUNT.addEventListener("click", () => {
		const { USERNAME_LOGIN, PASSWORD_LOGIN } = INPUTS;
		const username = USERNAME_LOGIN.value;
		const password = PASSWORD_LOGIN.value;

		fetch("http://localhost:3000/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ username, password }),
		})
			.then((res) => res.json())
			.then(async (data) => {
				if (data.error) {
					show_popup(data.error, "Okay", { bg: "hsl(0, 30.20%, 50.00%)", svg_icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M480-280q17 0 28.5-11.5T520-320q0-17-11.5-28.5T480-360q-17 0-28.5 11.5T440-320q0 17 11.5 28.5T480-280Zm-40-160h80v-240h-80v240Zm40 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>' });
				} else {
					const new_data = JSON.parse(decode_b64(data));
					await local.set(new_data);
					show_popup(`Successfully logged in.`, "Okay", { bg: "hsl(128, 30.20%, 50.00%)", svg_icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>' });
				}
			});
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
