import { local } from "../utilities/global.js";
import { getIndexes, getLatestId, create_element } from "../utilities/utilities.js";
import { show_popup } from "../utilities/utilities.js";

const GenerateElements = {
	select_method: document.getElementById("select-method"),
	unit_count: document.getElementById("unit-count"),
	card_count: document.getElementById("card-count"),
	generate_desc: document.querySelectorAll(".generate-count"),
	generate_card: document.getElementById("generate-card"),
	generate_input: document.getElementById("generate-input"),
};

export function setElSelectListener() {
	const { select_method, unit_count, card_count, generate_card, generate_input, generate_desc } = GenerateElements;
	select_method.addEventListener("change", () => {
		switch (select_method.value) {
			case "muni-note":
				unit_count.classList.add("no-display");
				card_count.classList.add("no-display");
				generate_desc.forEach((desc) => desc.classList.add("no-display"));
				generate_input.innerHTML = "Input your study materials here or your Muni notes like the one below:<br /><br />-q What is Muni? <br />-a Muni is a reviewer app<br />-q Or in one line -a Like this";
				break;
			case "ai-gpt":
			case "ai-gemini":
				unit_count.closest(".select-generate-path").style = "grid-template-column:";
				unit_count.classList.remove("no-display");
				card_count.classList.remove("no-display");
				generate_desc.forEach((desc) => desc.classList.remove("no-display"));
				generate_input.innerHTML = "Input your materials or additional instructions (optional) here<br/><br/>Muni will do the rest ;)";
				break;
		}
	});

	generate_card.addEventListener("click", async () => {
		// No matches handle
		const userdata = await local.get(null);
		const method = select_method.value;

		const units_count = parseInt(unit_count.value) || 1;
		const cards_per_unit_count = parseInt(card_count.value) || 10;

		const user_topic = generate_input.innerText.replace("/[s]+/g", " ");

		const format = `
			!mt=Module Title
			!md=Module Desc
			!unit!
			!ut=Unit Title
			!ud=Unit Desc
			!cards!
			!q=Question
			!a=Answer
			!k=Keyword of question should not spoil the answer
			!h=Hint
			!q=Q
			!a=A
			!k=K
			!h=H
			!unit!
			!q=Q
			!a=A
			!k=K
			!h=H
			... continue
		`;

		const instruction = `
		Create me flashcards based on provided format and topic. Make ${units_count} units and ${cards_per_unit_count} cards per unit.
		
		Format: ${format},
		Topic: ${user_topic}`;

		switch (method) {
			case "muni-note":
				parse_response_to_cards(userdata, user_topic, "user");
				break;
			case "ai-gpt":
			case "ai-gemini":
				const urls = {
					"ai-gpt": "https://chatgpt.com/?model=auto&temporary-chat=true&muniscrape=true",
					"ai-gemini": "https://gemini.google.com/app?muniscrape=true",
				};

				const url = urls[method];

				chrome.windows.create(
					{
						left: 0,
						focused: true,
						type: "popup",
						width: 10,
						height: 10,
						left: 0,
						top: 0,
						url,
					},
					(window) => {
						const { id } = window;
						const tabId = window.tabs[0].id;

						show_popup("Please wait for the newly popped-up window to close before you click anything. Thank you.", "I understand", { wait_before_exit_s: 5, bg: "hsl(50, 30%, 50%)", svg_icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="M280-420q25 0 42.5-17.5T340-480q0-25-17.5-42.5T280-540q-25 0-42.5 17.5T220-480q0 25 17.5 42.5T280-420Zm200 0q25 0 42.5-17.5T540-480q0-25-17.5-42.5T480-540q-25 0-42.5 17.5T420-480q0 25 17.5 42.5T480-420Zm200 0q25 0 42.5-17.5T740-480q0-25-17.5-42.5T680-540q-25 0-42.5 17.5T620-480q0 25 17.5 42.5T680-420ZM480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>' });

						if (method === "ai-gpt") {
							setTimeout(() => {
								chrome.tabs.sendMessage(tabId, { message: "scrape-gpt", instruction, id }, (response) => {
									parse_response_to_cards(userdata, response.qa, "ai");
									chrome.windows.remove(id);
								});
							}, 5000);
						} else if (method === "ai-gemini") {
							setTimeout(() => {
								chrome.tabs.sendMessage(tabId, { message: "scrape-gemini", instruction, id }, (response) => {
									if (response.answer !== "") response.qa += " " + response.answer;
									parse_response_to_cards(userdata, response.qa, "ai");
									chrome.windows.remove(id);
								});
							}, 5000);
						}
					}
				);
				break;
		}
	});
}

function clean_whitespace(str) {
	if (str) return str.replace(/[\n]/g, "").replace(/[ +]/g, " ");
}

function get_info_from_response(str, type) {
	switch (type) {
		case "user": {
			const user_string_regex = /-q\s+([\s\S]*?)-a\s+([\s\S]*?)(?=\s*-q\s+|\s*$)/g;
			const cards_matches = str.matchAll(user_string_regex);
			const parsed_response = {
				cards: [],
			};

			for (let card_match of cards_matches) {
				const front = clean_whitespace(card_match[1]);
				const back = clean_whitespace(card_match[2]);
				parsed_response.cards.push({ front, back });
			}
			return parsed_response;
		}
		case "ai": {
			const module_info_regex = /!mt=([\s\S]+?)!md=([\s\S]+?)!unit!/g;
			const ai_string_regex = /!unit!\s*!ut=([\s\S]+?)!ud=([\s\S]+?)!cards!([\s\S]+?)(?=!unit!|\s*$)/g;
			const unit_string_regex = /!q=([\s\S]+?)!a=([\s\S]+?)(?:!k=([\s\S]+?))?(?:!h=([\s\S]+?))?(?=!q=|\s*$)/g;

			const parsed_response = {
				units: [],
			};

			const module_info = module_info_regex.exec(str);
			parsed_response.title = clean_whitespace(module_info[1], "");
			parsed_response.description = clean_whitespace(module_info[2], " ");

			const unit_matches = str.matchAll(ai_string_regex);
			for (let unit_match of unit_matches) {
				const unit_info = {};
				unit_info.title = clean_whitespace(unit_match[1]);
				unit_info.description = clean_whitespace(unit_match[2]);
				unit_info.cards = [];

				const card_matches = unit_match[3].matchAll(unit_string_regex);
				for (let card_match of card_matches) {
					const front = clean_whitespace(card_match[1]);
					const back = clean_whitespace(card_match[2]);
					const keyword = clean_whitespace(card_match[3]);
					const hint = clean_whitespace(card_match[4]);

					unit_info.cards.push({ front, back, keyword, hint });
				}

				parsed_response.units.push(unit_info);
			}
			console.log(parsed_response);
			return parsed_response;
		}
	}
}

async function parse_response_to_cards(userdata, str, type) {
	const { modules } = userdata;
	const parsed_response = get_info_from_response(str, type);

	const module_id = getLatestId(modules);

	switch (type) {
		case "user": {
			const { cards } = parsed_response;
			console.log(cards);
			cards.forEach((card, i) => {
				card.moduleTitle = "Module";
				card.moduleId = module_id;
				card.unitTitle = "Unit";
				card.unitId = 0;

				card.id = i;
				card.type = "card";
				card.keyword = "Keyword";
				card.hint = "Hint";
				card.card_type = "flashcard";
				card.createdAt = String(new Date());
				card.isEditing = false;

				// Short-term-mode
				card.level = 1;

				// Long-term-mode
				card.easiness = 2.5;
				card.interval = 1;
				card.repetitions = 0;
				card.next_review = new Date().toISOString();
			});
			const new_module = {
				id: module_id,
				type: "module",
				title: "Module",
				description: "Generated with Muni",

				author: "Author",
				createdAt: String(new Date()),
				isActive: true,
				isEditing: false,
				units: [
					{
						id: 0,
						title: "Unit",
						description: "Generated with Muni",
						type: "unit",
						createdAt: String(new Date()),
						isActive: true,
						isEditing: false,
						cards,
					},
				],
			};

			modules.push(new_module);

			break;
		}
		case "ai": {
			const { title, description, units } = parsed_response;
			units.forEach((unit, i) => {
				unit.id = i;
				unit.type = "unit";
				unit.createdAt = String(new Date());
				unit.isActive = true;
				unit.isEditing = false;

				unit.cards.forEach((card, i) => {
					card.moduleTitle = title;
					card.moduleId = module_id;
					card.unitTitle = unit.title;
					card.unitId = unit.id;

					card.id = i;
					card.type = "card";
					card.card_type = "flashcard";
					card.createdAt = String(new Date());
					card.isEditing = false;

					// Short-term-mode
					card.level = 1;

					// Long-term-mode
					card.easiness = 2.5;
					card.interval = 1;
					card.repetitions = 0;
					card.next_review = new Date().toISOString();
				});
			});
			const new_module = {
				id: module_id,
				type: "module",
				title,
				description,

				author: "Author",
				createdAt: String(new Date()),
				isActive: true,
				isEditing: false,
				units,
			};

			modules.push(new_module);

			break;
		}
	}
	show_popup("Successfully created flashcards.", "Okay", { bg: "hsl(128, 30.20%, 50.00%)", svg_icon: '<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#CCCCCC"><path d="m424-296 282-282-56-56-226 226-114-114-56 56 170 170Zm56 216q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm0-80q134 0 227-93t93-227q0-134-93-227t-227-93q-134 0-227 93t-93 227q0 134 93 227t227 93Zm0-320Z"/></svg>' });
	await local.set({
		modules,
	});
}

(() => {
	// Archive All Chats
	document.querySelectorAll('div[aria-label*="More options"]').forEach((a) => a.click());
	setTimeout(() => document.querySelectorAll('path[d="M8 7.5a1 1 0 00-1 1V10a1 1 0 001 1h20a1 1 0 001-1V8.5a1 1 0 00-1-1H8z"]').forEach((b) => b.closest("div[aria-labelledby]").click()), 3000);
})();
