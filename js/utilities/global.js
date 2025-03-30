// GLOBAL VARIABLES
// To make typing namespace developer friendly
export const browser = chrome;
export const storage = browser.storage;
export const local = storage.local;

export const ELEMENTS = {
	LIBRARY: document.getElementById("main-library"),
	LIBRARY_HEADER: document.getElementById("library-header"),
	LIBRARY_CURRENT: document.getElementById("library-current"),
	LIBRARY_CURRENT_TITLE: document.getElementById("library-current-title"),
	LIBRARY_CONTENTS: document.getElementById("library-contents"),
	LIBRARY_BACK: document.getElementById("library-back"),
	LIBRARY_ADD: document.getElementById("library-add"),
};

// DEFAULT STORAGE STRUCTURE
// This is used as the default storage structure for first-time installed
export const STORAGE_STRUCT = {
	settings: {
		theme: "system",
		section_visibility: {
			library: true,
			statistic: false,
			rules: false,
			settings: false,
		},
	},
	modules: [
		{
			id: 0,
			type: "module",
			title: "Title",
			description: "Description",

			author: "Author",
			createdAt: String(new Date()),
			isActive: true,
			isEditing: false,
			units: [
				{
					id: 0,
					type: "unit",
					title: "Title",
					description: "Description",

					createdAt: String(new Date()),
					isActive: true,
					isEditing: false,
					cards: [
						{
							id: 0,
							type: "card",
							card_type: "flashcard",
							level: 0, // If 6, then it's done
							createdAt: String(new Date()),
							isEditing: false,

							front: "Front",
							back: "Back",
						},
						// {
						// 	id: 1,
						// 	type: "card",
						// 	card_type: "truefalse",
						// 	question: "Question",
						// 	answer: true,

						// 	level: 0, // If 6, then it's done
						// 	createdAt: new Date(),
						// },
						// {
						// 	id: 2,
						// 	type: "card",
						// 	card_type: "identification",
						// 	question: "Identification",
						// 	answer: "string",

						// 	level: 0, // If 6, then it's done
						// 	createdAt: new Date(),
						// },
						// {
						// 	id: 3,
						// 	type: "card",
						// 	card_type: "multiple",
						// 	question: "Multiple",
						// 	choices: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
						// 	answer: 0,

						// 	level: 0,
						// 	createdAt: new Date(),
						// },
					],
				},
			],
		},
	],
};
