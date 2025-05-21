const SM2_DEFAULT_EASINESS = 2.5;
const SM2_MIN_EASINESS = 1.3;

/**
 * Retrieves data from Chrome's local storage.
 * @param {string|string[]} keys - The key(s) to retrieve.
 * @returns {Promise<object>} - A promise that resolves with the data.
 */
function storageGet(keys) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.get(keys, (result) => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve(result);
			}
		});
	});
}

/**
 * Stores data in Chrome's local storage.
 * @param {object} items - An object containing key-value pairs to store.
 * @returns {Promise<void>} - A promise that resolves when the data is stored.
 */
function storageSet(items) {
	return new Promise((resolve, reject) => {
		chrome.storage.local.set(items, () => {
			if (chrome.runtime.lastError) {
				reject(chrome.runtime.lastError);
			} else {
				resolve();
			}
		});
	});
}

/**
 * Calculates the next review date based on the interval.
 * @param {number} intervalInDays - The interval in days.
 * @returns {Date} - The next review date.
 */
function calculateNextReview(intervalInDays) {
	const now = new Date();
	const nextReviewDate = new Date(now);
	nextReviewDate.setDate(now.getDate() + intervalInDays);
	return nextReviewDate;
}

/**
 * Applies the SuperMemo-2 algorithm to a card.
 * @param {object} card - The card object to update.
 * @param {number} grade - The user's grade (0-5) for the recall.
 * @returns {object} - The updated card object.
 */
function applySM2(card, grade) {
	const now = new Date();

	if (grade >= 3) {
		card.repetitions = (card.repetitions || 0) + 1; // Ensure repetitions exists
		if (card.repetitions === 1) {
			card.interval = 1;
		} else if (card.repetitions === 2) {
			card.interval = 6;
		} else {
			card.interval = Math.round(card.interval * card.easiness);
		}
		card.easiness = Math.max(SM2_MIN_EASINESS, card.easiness + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)));
	} else {
		card.repetitions = 0;
		card.interval = 1;
		card.easiness = Math.max(SM2_MIN_EASINESS, card.easiness - 0.2);
	}
	card.lastReviewed = now.toISOString();
	card.nextReview = calculateNextReview(card.interval).toISOString();
	return card;
}

/**
 * Finds a card by its ID within the nested module structure.
 * @param {object[]} modules - The array of modules.
 * @param {number} cardId - The ID of the card to find.
 * @returns {{moduleIndex: number, unitIndex: number, cardIndex: number, card: object} | null} -
 * An object containing the indices and the card if found, otherwise null.
 */
function findCard(modules, cardId) {
	for (let i = 0; i < modules.length; i++) {
		const module = modules[i];
		for (let j = 0; j < module.units.length; j++) {
			const unit = module.units[j];
			for (let k = 0; k < unit.cards.length; k++) {
				const card = unit.cards[k];
				if (card.id === cardId) {
					return {
						moduleIndex: i,
						unitIndex: j,
						cardIndex: k,
						card: card,
					};
				}
			}
		}
	}
	return null;
}

/**
 * Updates the card in the modules array
 * @param {object[]} modules - the array of modules
 * @param {number} moduleId - the module ID
 * @param {number} unitId - the unit ID
 * @param {number} cardId - the card ID
 * @param {object} updatedCard - the updated card object
 * @returns {object[]} - the updated modules
 */
function updateCardInModules(modules, moduleId, unitId, cardId, updatedCard) {
	const moduleIndex = modules.findIndex((m) => m.id === moduleId);
	if (moduleIndex !== -1) {
		const unitIndex = modules[moduleIndex].units.findIndex((u) => u.id === unitId);
		if (unitIndex !== -1) {
			const cardIndex = modules[moduleIndex].units[unitIndex].cards.findIndex((c) => c.id === cardId);
			if (cardIndex !== -1) {
				modules[moduleIndex].units[unitIndex].cards[cardIndex] = updatedCard;
			}
		}
	}
	return modules;
}

// Example Usage
async function initializeAndRun() {
	// 1. Load modules from storage
	let data = await storageGet("modules");
	let modules = data.modules || [
		{
			id: 0,
			type: "module",
			title: "Module 1",
			description: "Description 1",
			author: "Author 1",
			createdAt: String(new Date()),
			isActive: true,
			isEditing: false,
			units: [
				{
					id: 0,
					type: "unit",
					title: "Unit 1",
					description: "Description 1",
					createdAt: String(new Date()),
					isActive: true,
					isEditing: false,
					cards: [
						{
							id: 0,
							type: "card",
							card_type: "flashcard",
							level: 1, // If 6, then it's done
							createdAt: String(new Date()),
							isEditing: false,
							moduleTitle: "Title",
							unitTitle: "Title",
							unitId: 0,
							moduleId: 0,
							front: "Question 1",
							back: "Answer 1",
							keyword: "Keyword 1",
							hint: "Hint 1",
							easiness: SM2_DEFAULT_EASINESS, // Added for SM2
							interval: 1, // Added for SM2
							repetitions: 0, // Added for SM2
							lastReviewed: null,
							nextReview: calculateNextReview(0).toISOString(), // Added for SM2, initial review
						},
						{
							id: 1,
							type: "card",
							card_type: "flashcard",
							level: 1, // If 6, then it's done
							createdAt: String(new Date()),
							isEditing: false,
							moduleTitle: "Title",
							unitTitle: "Title",
							unitId: 0,
							moduleId: 0,
							front: "Question 2",
							back: "Answer 2",
							keyword: "Keyword 2",
							hint: "Hint 2",
							easiness: SM2_DEFAULT_EASINESS,
							interval: 1,
							repetitions: 0,
							lastReviewed: null,
							nextReview: calculateNextReview(0).toISOString(),
						},
					],
				},
			],
		},
	];

	if (!data.modules) {
		await storageSet({ modules });
	}

	// 2. Simulate reviewing a card
	const cardToReview = findCard(modules, 0); //find card with ID 0
	if (cardToReview) {
		console.log("Card to review:", cardToReview.card);

		// Simulate user providing a grade (0-5)
		const grade = 4;
		const updatedCard = applySM2(cardToReview.card, grade);
		modules = updateCardInModules(modules, cardToReview.moduleId, cardToReview.unitId, cardToReview.card.id, updatedCard);

		console.log("Updated card:", updatedCard);

		// 3. Save the updated modules back to storage
		await storageSet({ modules });

		console.log("Modules after review:", modules);

		//4. Get next card to review
		const nextCardToReview = getNextCardToReview(modules);

		if (nextCardToReview) {
			console.log("Next card to review: ", nextCardToReview);
		} else {
			console.log("No cards to review at this time.");
		}
	} else {
		console.log("Card not found!");
	}
}

/**
 * Gets the next card to review
 * @param {object[]} modules - array of modules
 * @returns {object | null} - the next card to review or null if there are no cards to review
 */
function getNextCardToReview(modules) {
	const now = new Date();
	let nextCard = null;
	let earliestReviewDate = null;

	for (const module of modules) {
		for (const unit of module.units) {
			for (const card of unit.cards) {
				const nextReview = card.nextReview ? new Date(card.nextReview) : null;

				if (nextReview && now >= nextReview) {
					if (!earliestReviewDate || nextReview < earliestReviewDate) {
						earliestReviewDate = nextReview;
						nextCard = card;
					}
				}
			}
		}
	}
	return nextCard;
}

//Run the functions
initializeAndRun();
