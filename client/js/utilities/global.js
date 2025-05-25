// GLOBAL VARIABLES
// To make typing namespace developer friendly
export const browser = chrome;
export const storage = browser.storage;
export const local = storage.local;

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
		rules: {
			learning_mode: "short",
			show_keyword: false,
			intervalMs: 60000 * 5,
		},
	},
	reason: "", // Would be better if this in array for greater control
	inject: {
		answered: false,
		time: undefined,
	},
	modules: [
		{
			id: 0,
			type: "module",
			title: "Module",
			description: "Description",

			author: "Author",
			createdAt: new Date().toISOString(),
			isActive: true,
			isEditing: false,
			units: [
				{
					id: 0,
					type: "unit",
					title: "Unit",
					description: "Description",

					createdAt: new Date().toISOString(),
					isActive: true,
					isEditing: false,
					cards: [
						{
							id: 0,
							type: "card",
							card_type: "flashcard",
							createdAt: new Date().toISOString(),
							isEditing: false,

							moduleTitle: "Title",
							unitTitle: "Title",
							unitId: 0,
							moduleId: 0,

							front: "Question",
							back: "Answer",
							keyword: "Keyword",
							hint: "Hint",

							// Short-term-mode
							level: 1, // If 6, then it's done

							// Long-term-mode
							easiness: 2.5,
							interval: 1,
							repetitions: 0,
							next_review: new Date().toISOString(),
						},
						// {
						// 	id: 1,
						// 	type: "card",
						// 	card_type: "truefalse",
						// 	question: "Question",
						// 	answer: true,

						// 	level: 1, // If 6, then it's done
						// 	createdAt: new Date(),
						// },
						// {
						// 	id: 2,
						// 	type: "card",
						// 	card_type: "identification",
						// 	question: "Identification",
						// 	answer: "string",

						// 	level: 1, // If 6, then it's done
						// 	createdAt: new Date(),
						// },
						// {
						// 	id: 3,
						// 	type: "card",
						// 	card_type: "multiple",
						// 	question: "Multiple",
						// 	choices: ["Choice 1", "Choice 2", "Choice 3", "Choice 4"],
						// 	answer: 0,

						// 	level: 1,
						// 	createdAt: new Date(),
						// },
					],
				},
			],
		},
	],
};

// This gets executed when imported, which is not viable for extensions that has multiple context (background & page scripts)
// TODO --> Fix this mess or learn from it lol
// One of the fix is wrap it in function or just create another file
// FIXED: use 'self' which is kind of 'window' global object but for service workers...
export let ELEMENTS = undefined;
if (self.document) {
	ELEMENTS = {
		LIBRARY: document.getElementById("main-library"),
		LIBRARY_HEADER: document.getElementById("library-header"),
		LIBRARY_CURRENT: document.getElementById("library-current"),
		LIBRARY_CURRENT_TITLE: document.getElementById("library-current-title"),
		LIBRARY_CONTENTS: document.getElementById("library-contents"),
		LIBRARY_BACK: document.getElementById("library-back"),
		LIBRARY_ADD: document.getElementById("library-add"),
		SESSION: document.getElementById("main-session"),
		SESSION_CONTENTS: document.getElementById("card-container"),
		SESSION_LEVELS_CONTAINER: document.getElementById("main-session").querySelector(".card-levels"),
		SESSION_LEVELS: document.getElementById("main-session").querySelectorAll(".card-levels span"),
	};
}

// This is the better way, functions are only executed by the time they are called
class DefaultElements {
	get_main_elements() {}
	get_library_elements() {}
	get_session_elements() {}
	get_generate_elements() {}
	get_rules_elements() {}
	get_settings_elements() {
		return {
			LIBRARY: document.getElementById("main-library"),
			STATISTIC: document.getElementById("main-statistic"),
			RULES: document.getElementById("main-rules"),
			AI: document.getElementById("main-ai"),
			SETTINGS: document.getElementById("main-usersettings"),
		};
	}
}

export const elements = new DefaultElements();
