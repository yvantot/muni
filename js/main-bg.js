import { storage, local, STORAGE_STRUCT } from "./utilities/global.js";

const INTERVALS = {
	timer: undefined,
};
// Background scripts will handle the timer
// Background scripts will die after 30 seconds of idle
async function init() {
	let userdata = await local.get(null);
	if (Object.keys(userdata).length === 0) {
		userdata = STORAGE_STRUCT;
		await local.set(userdata);
	}
	if (userdata.inject.answered) {
		const time = new Date(userdata.inject.time);
		const intervalMs = new Date(userdata.settings.rules.intervalMs);

		if (INTERVALS.timer) clearInterval(INTERVALS.timer);

		// Use setInterval instead of setTimeout to avoid script death
		INTERVALS.timer = setInterval(async () => {
			const elapsedTime = new Date() - time;
			console.log("Counting: " + elapsedTime);
			if (elapsedTime >= intervalMs) {
				const { inject } = await local.get("inject");
				inject.answered = false;
				await local.set({ inject });
				clearInterval(INTERVALS.timer);
			}
		}, 1000);
	}
}

storage.onChanged.addListener(async () => {
	let userdata = await local.get(null);

	if (userdata.inject.answered) {
		const time = new Date(userdata.inject.time);
		const intervalMs = new Date(userdata.settings.rules.intervalMs);

		if (INTERVALS.timer) clearInterval(INTERVALS.timer);

		// Use setInterval instead of setTimeout to avoid script death
		INTERVALS.timer = setInterval(async () => {
			const elapsedTime = new Date() - time;
			console.log("Counting: " + elapsedTime);
			if (elapsedTime >= intervalMs) {
				const { inject } = await local.get("inject");
				inject.answered = false;
				await local.set({ inject });
				clearInterval(INTERVALS.timer);
			}
		}, 1000);
	}
});

chrome.runtime.onMessage.addListener(async (receive, _, send) => {
	const { message } = receive;
	switch (message) {
		case "reload":
			chrome.runtime.reload();
			break;
		default:
			console.error("Unhandled message");
			break;
	}
});

init();
