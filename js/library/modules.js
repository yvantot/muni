import { ELEMENTS, local } from "../utilities/global.js";
import { getIndexes, getCardsCount, isEmptyStr, dateToYYYYMMDD, addPlural } from "../utilities/utilities.js";
import { renderElLibrary } from "./library.js";

export function getElModules(modules) {
	const container = document.createElement("div");
	container.classList.add("modules-container");
	modules.forEach((module) => {
		container.appendChild(getElModule(module));
	});
	return container;
}

function getElModule(module) {
	const { id, title, description, author, createdAt, isActive, units, isEditing } = module;

	const unitsCount = units.length;
	const cardsCount = getCardsCount(units);
	const container = document.createElement("div");
	const isEditingInfo = isEmptyStr(title) || isEmptyStr(description) || isEditing;

	// Classes
	if (!isActive) container.classList.add("not-active");
	container.classList.add("module");
	container.dataset.id = id;

	container.innerHTML = `
        <div class="module-toolbar">
            <button class="active-button">            
                ${isActive ? '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m380-300 280-180-280-180v360ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z" /></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M360-320h80v-320h-80v320Zm160 0h80v-320h-80v320ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>'}                
            </button>
            <button class="edit-info"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg></button>
            <button class="delete">
                <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
            </button>
        </div>
        <button class='forward-button'>
            <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M647-440H160v-80h487L423-744l57-56 320 320-320 320-57-56 224-224Z"/></svg>
        </button>                
        ${isEditingInfo ? '<button class="edit-button"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg></button>' : ""}
        <div class="module-info">
            <p contentEditable="${isEditingInfo ? "true" : "false"}" class="module-title ${isEditingInfo ? "editing" : ""}">${isEmptyStr(title) ? "Title" : title}</p>
            <p contentEditable="${isEditingInfo ? "true" : "false"}" class="module-description ${isEditingInfo ? "editing" : ""}">${isEmptyStr(description) ? "Description" : description}</p>
            <p class="module-createdAt">${dateToYYYYMMDD(new Date(createdAt))}</p>
            <div class="module-info">
                <p contentEditable="${isEditingInfo ? "true" : "false"}" class="module-author ${isEditingInfo ? "editing" : ""}">${isEmptyStr(author) ? "Author" : author}</p>
                <p>${unitsCount} unit${addPlural(unitsCount)} - ${cardsCount} card${addPlural(cardsCount)}</p>
            </div>
        </div>
    `;
	setElModuleListener(container, id, isEditingInfo);
	return container;
}

function setElModuleListener(container, moduleId, isEditingInfo) {
	// Forward
	container.querySelector(".forward-button").addEventListener("click", async () => {
		if (isEditingInfo) return;

		const userdata = await local.get(null);
		ELEMENTS.LIBRARY_CONTENTS.dataset.currentNav = "units";
		ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId = moduleId;
		renderElLibrary(userdata, moduleId, -1);
	});

	// Edit
	if (isEditingInfo) {
		container.querySelector(".edit-button").addEventListener("click", async () => {
			const description = container.querySelector(".module-description");
			const title = container.querySelector(".module-title");
			const author = container.querySelector(".module-author");

			if (isEmptyStr(description.innerText) || isEmptyStr(title.innerText) || isEmptyStr(author.innerText)) {
				alert("Please finish editing");
			} else {
				const userdata = await local.get(null);
				const { moduleIndex } = getIndexes(userdata, moduleId);

				userdata.modules[moduleIndex].isEditing = false;
				userdata.modules[moduleIndex].title = title.innerText;
				userdata.modules[moduleIndex].description = description.innerText;
				userdata.modules[moduleIndex].author = author.innerText;
				await local.set(userdata);
			}
		});
	}

	// Delete
	container.querySelector(".delete").addEventListener("click", async () => {
		const userdata = await local.get(null);

		const { moduleIndex } = getIndexes(userdata, moduleId);
		userdata.modules.splice(moduleIndex, 1);

		await local.set(userdata);
	});

	// Active
	container.querySelector(".active-button").addEventListener("click", async () => {
		const userdata = await local.get(null);

		const { moduleIndex } = getIndexes(userdata, moduleId);
		userdata.modules[moduleIndex].isActive = !userdata.modules[moduleIndex].isActive;
		await local.set(userdata);
	});

	// Edit
	const editBtn = container.querySelector(".edit-info");
	if (editBtn) {
		editBtn.addEventListener("click", async () => {
			const userdata = await local.get(null);

			const { moduleIndex } = getIndexes(userdata, moduleId);
			userdata.modules[moduleIndex].isEditing = !userdata.modules[moduleIndex].isEditing;
			await local.set(userdata);
		});
	}
}
