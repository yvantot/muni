export function getLatestId(array) {
	// Expects modules, units, cards, not array of ids
	let id = getMaxNumber(array.map((val) => val.id)) ?? 0;
	if (array.length !== 0) id += 1;
	return id;
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

export function independent_show_popup(message, button_message, config) {
	const existing_popup = document.getElementById("popup-message");
	const existing_style = document.getElementById("popup-message-style");

	if (existing_popup) existing_popup.remove();
	if (existing_style) existing_style.remove();

	const { wait_before_exit_s = 0, svg_icon = "", bg = "white" } = config;

	const style = document.createElement("style");
	const parent = document.createElement("div");

	style.setAttribute("id", "popup-message-style");
	parent.setAttribute("id", "popup-message");
	parent.setAttribute("class", "popup-message");
	parent.setAttribute("style", `background: ${bg};`);

	style.innerHTML = `.popup-message,button{font-size:clamp(.8rem, 2vw, 1.3rem)}.popup-message{z-index:99999;position:fixed;padding:3rem;top:50%;left:50%;transform:translate(-50%,-50%);min-width:50vw;min-height:50vh;border-radius:1rem;box-shadow:var(--card-shadow);display:flex;flex-direction:column;justify-content:center;gap:1rem;align-items:center;text-align:center}svg{width:30%;height:30%}button{width:clamp(15ch,50%,30ch);padding:.5rem;border-radius:.5rem;border:1px solid hsla(0,0%,100%,.5);box-shadow:0 10px 10px hsla(0,0%,10%,.2);transition:transform .3s}button:hover{transform:scale(1.05,1.05)}`;
	parent.innerHTML = `${svg_icon}<p>${message}</p><button>-</button>`;

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
			style.remove();
		});
	}, wait_before_exit_s * 1000);

	document.documentElement.appendChild(style);
	document.documentElement.appendChild(parent);
}

export function show_popup(message, button_message, config) {
	// Delete existing popup
	document.getElementById("popup-message")?.remove();

	const { wait_before_exit_s = 0, svg_icon = "", bg = "" } = config;

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
