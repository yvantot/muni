export function getLatestId(array) {
	let id = getMaxNumber(array.map((val) => val.id)) ?? 0;
	if (array.length !== 0) id += 1;
	return id;
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
