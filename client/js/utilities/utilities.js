export function getLatestId(array) {
	// Expects modules, units, cards, not array of ids
	let id = getMaxNumber(array.map((val) => val.id)) ?? 0;
	if (array.length !== 0) id += 1;
	return id;
}

export function encode_b64(str) {
	const bytes = new TextEncoder().encode(str);
	const base64 = btoa(
		Array.from(bytes)
			.map((byte) => String.fromCharCode(byte))
			.join("")
	);
	return base64;
}

export function decode_b64(b64) {
	const binary = atob(b64);
	const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
	const str = new TextDecoder().decode(bytes);
	return str;
}

export function calculate_next_review(interval) {
	const now = new Date();
	const next_review_date = new Date(now);
	next_review_date.setDate(now.getDate() + interval);
	return next_review_date.toISOString();
}

// May cause code inconsistences
export function create_element(name, attr) {
	const element = document.createElement(name);

	for (let key in attr) {
		if (key === "dataset" && typeof attr[key] === "object") {
			for (let data in attr.dataset) {
				element.dataset[data] = attr.dataset[data];
			}
		} else if (key in element) {
			element[key] = attr[key];
		} else {
			element.setAttribute(key, attr[key]);
		}
	}

	return element;
}

export function show_popup(message, button_message = "Okay", config = {}) {
	// Delete existing popup
	document.getElementById("popup-message")?.remove();

	const successful_svg = '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>';

	const { wait_before_exit_s = 0, svg_icon = successful_svg, bg = "hsl(128, 30.20%, 50.00%)" } = config;

	// Create element
	const parent = create_element("div", {
		id: "popup-message",
		class: "popup-message",
		style: `background: ${bg};`,
	});

	parent.innerHTML = `		
		${svg_icon}
		<p>${message}</p>		
		<button>-</button>
	`;

	const button = parent.querySelector("button");

	let wait_counter_interval = null;
	if (wait_before_exit_s > 0) {
		let second = 0;
		wait_counter_interval = setInterval(() => {
			second += 1;
			button.innerText = "Wait " + (wait_before_exit_s - second);
		}, 1000);
	}

	setTimeout(() => {
		clearInterval(wait_counter_interval);
		button.innerText = button_message;
		button.addEventListener("click", () => {
			parent.remove();
		});
	}, wait_before_exit_s * 1000);

	document.documentElement.appendChild(parent);
}

export function getIndexes(userdata, moduleId = -1, unitId = -1, cardId = -1) {
	const indexes = { moduleIndex: null, unitIndex: null, cardIndex: null };
	const { modules } = userdata;

	const moduleIndex = modules.findIndex((module) => module.id === parseInt(moduleId));
	if (moduleId >= 0) {
		indexes.moduleIndex = moduleIndex;
	}
	if (unitId >= 0) {
		const unitIndex = modules[moduleIndex].units.findIndex((unit) => unit.id === parseInt(unitId));
		indexes.unitIndex = unitIndex;
	}
	if (cardId >= 0) {
		const unitIndex = modules[moduleIndex].units.findIndex((unit) => unit.id === parseInt(unitId));
		const cardIndex = modules[moduleIndex].units[unitIndex].cards.findIndex((card) => card.id === parseInt(cardId));
		indexes.cardIndex = cardIndex;
	}
	return indexes;
}

export function dateToYYYYMMDD(date, divider) {
	divider = divider ?? "-";
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}${divider}${month}${divider}${day}`;
}

export function getMaxNumber(arr) {
	if (arr.length === 0) return undefined;

	let max = arr[0];
	for (let i = 1; i < arr.length; i++) {
		if (arr[i] > max) max = arr[i];
	}
	return max;
}

export function cutString(str, length = 10) {
	if (isEmptyStr(str)) return "..";
	return str.length > length ? str.slice(0, length) + ".." : str;
}

export function isEmptyStr(str) {
	return str.trim().length === 0;
}

export function addPlural(length) {
	if (length > 1) return "s";
	return "";
}

export function getCardsCount(units) {
	let cardsCount = 0;
	for (let i = 0; i < units.length; i++) {
		cardsCount += units[i].cards.length;
	}
	return cardsCount;
}
