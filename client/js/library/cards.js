import { ELEMENTS, local } from "../utilities/global.js";

import { getIndexes, isEmptyStr, dateToYYYYMMDD, addPlural } from "../utilities/utilities.js";

export function getElCards(cards) {
	const container = document.createElement("div");
	container.classList.add("cards-container");
	cards.forEach((card) => {
		container.appendChild(getElCard(card));
	});
	return container;
}

function getElCard(card) {
	const { id, type, card_type, level, createdAt, isEditing, next_review } = card;

	const container = document.createElement("div");

	container.classList.add("library-card");
	container.dataset.id = id;

	// THIS CAN BE IMPROVED TO MAKE IT MORE EASY TO MAINTAIN
	// BY MAKING IT MODULAR
	switch (card_type) {
		case "flashcard":
			const { front, back } = card;
			container.classList.add("library-flashcard");
			const isEditingInfo = isEmptyStr(front) || isEmptyStr(back) || isEditing;
			const appearing_in = new Date(next_review).getDate() - new Date().getDate();

			container.innerHTML = `
                <div class="library-card-toolbar">
                    <button class="edit-info">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" /></svg>
                    </button>
                    <button class="delete">
                        <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z" /></svg>
                    </button>
                </div>                
                ${isEditingInfo ? '<button class="edit-button"><svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg></button>' : ""}
                <div class="library-card-info">
                    <p contentEditable="${isEditingInfo ? "true" : "false"}" class="front ${isEditingInfo ? "editing" : ""}">${isEmptyStr(front) ? "Front" : front}</p>
                    <p contentEditable="${isEditingInfo ? "true" : "false"}" class="back ${isEditingInfo ? "editing" : ""}">${isEmptyStr(back) ? "Back" : back}</p>
                    <div>
                        <span class="library-card-createdAt">${dateToYYYYMMDD(new Date(createdAt))}</span>
                        <span class="library-card-level">${level <= 5 ? "Level " + level : "Done"}</span>						
                    </div>
					<span class="library-next-review">${appearing_in > 0 ? "In " + appearing_in + ` day${addPlural(appearing_in)}` : "Today"} </span>
                </div>
            `;

			setElCardListener(container, id, isEditingInfo);
			break;
		case "truefalse":
			break;
		case "identification":
			break;
		case "multiple":
			break;
	}

	return container;
}

function setElCardListener(container, cardId, isEditingInfo) {
	if (isEditingInfo) {
		// Edit
		container.querySelector(".edit-button").addEventListener("click", async () => {
			const front = container.querySelector(".front");
			const back = container.querySelector(".back");

			if (isEmptyStr(front.innerText) || isEmptyStr(back.innerText)) {
				alert("Please finish editing");
			} else {
				const userdata = await local.get(null);

				const moduleId = ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId;
				const unitId = ELEMENTS.LIBRARY_CONTENTS.dataset.unitId;
				const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);
				userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].front = front.innerText;
				userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].back = back.innerText;
				userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].isEditing = false;
				userdata.reason = "update-card-structure";
				await local.set(userdata);
			}
		});
	}

	// Delete
	container.querySelector(".delete").addEventListener("click", async () => {
		const userdata = await local.get(null);

		const moduleId = ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId;
		const unitId = ELEMENTS.LIBRARY_CONTENTS.dataset.unitId;
		const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);

		userdata.modules[moduleIndex].units[unitIndex].cards.splice(cardIndex, 1);
		userdata.reason = "update-card-structure";
		await local.set(userdata);
	});

	// Edit
	const editBtn = container.querySelector(".edit-info");
	if (editBtn) {
		editBtn.addEventListener("click", async () => {
			const userdata = await local.get(null);
			const moduleId = ELEMENTS.LIBRARY_CONTENTS.dataset.moduleId;
			const unitId = ELEMENTS.LIBRARY_CONTENTS.dataset.unitId;
			const { moduleIndex, unitIndex, cardIndex } = getIndexes(userdata, moduleId, unitId, cardId);

			userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].isEditing = !userdata.modules[moduleIndex].units[unitIndex].cards[cardIndex].isEditing;
			await local.set(userdata);
		});
	}
}
