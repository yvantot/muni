import { local } from "../utilities/global.js";
import { getIndexes, getLatestId, create_element } from "../utilities/utilities.js";

const GenerateElements = {
	select_method: document.getElementById("select-method"),
	generate_card: document.getElementById("generate-card"),
	generate_input: document.getElementById("generate-input"),
};

export function setElSelectListener() {
	const { select_method, generate_card, generate_input } = GenerateElements;

	select_method.addEventListener("change", () => {
		switch (select_method.value) {
			case "muni-note":
				generate_input.innerHTML = "Input your study materials here or your Muni notes like the one below:<br /><br />-q What is Muni? <br />-a Muni is a reviewer app<br />-q Or in one line -a Like this";
				break;
			case "ai-gpt":
			case "ai-gemini":
				generate_input.innerHTML = "Input your materials or additional instructions (optional) here<br/><br/>Muni will do the rest ;)";
				break;
		}
	});

	generate_card.addEventListener("click", async () => {
		// No matches handle
		const userdata = await local.get(null);
		const method = select_method.value;

		const unit_count = 3 || "1";
		const cards_per_unit_count = 5 || "20";

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
			!k=Keyword
			!h=Hint
			!unit!
			... continue
		`;

		const instruction = `
		Create me flashcards based on provided format and topic. Make ${unit_count} units and ${cards_per_unit_count} cards per unit.
		
		Format: ${format},
		Topic: ${user_topic}`;

		console.log("Instruction ", instruction);

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

						if (method === "ai-gpt") {
							setTimeout(() => {
								chrome.tabs.sendMessage(tabId, { message: "scrape-gpt", instruction }, (response) => {
									console.log(response);
									parse_response_to_cards(userdata, response.qa, "ai");
									chrome.windows.remove(id);
								});
							}, 5000);
						} else if (method === "ai-gemini") {
							setTimeout(() => {
								chrome.tabs.sendMessage(tabId, { message: "scrape-gemini", instruction }, (response) => {
									if (response.answer !== "") response.qa += " " + response.answer;
									console.log(response);
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
				card.card_type = "flashcard";
				card.level = 1;
				card.createdAt = String(new Date());
				card.isEditing = false;
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
					card.level = 1;
					card.createdAt = String(new Date());
					card.isEditing = false;
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
	await local.set({
		reason: "update-card-structure",
		modules,
	});
}
