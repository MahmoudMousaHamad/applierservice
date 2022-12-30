import { ElementHandle } from "puppeteer";
import Natural from "natural";

import { SingletonCategorizer } from "../lib/Categorizer";
import { Helper } from "../driver";
import { Logger } from "../lib";
import { Site } from "../sites";

const SCORE_THRESHOLD = 1;

export enum QuestionTypes {
	textarea = "textarea",
	checkbox = "checkbox",
	select = "select",
	number = "number",
	radio = "radio",
	date = "date",
	text = "text",
}

export type QuestionsInfo = {
	[key in QuestionTypes]: QuestionInfo;
};

export class QuestionInfo {
	type: string;

	inputSelector: string[];

	textSelector: string[];

	optionsSelector: string | null;

	constructor(
		type: string,
		inputSelector: string[] | string,
		textSelector: string[] | string,
		optionsSelector: null | string = null
	) {
		this.type = type;
		this.inputSelector = Array.isArray(inputSelector)
			? inputSelector
			: [inputSelector];
		this.textSelector = Array.isArray(textSelector)
			? textSelector
			: [textSelector];
		this.optionsSelector = optionsSelector;
	}
}

class Question {
	site: Site;

	type?: QuestionTypes | null;

	text: string | null;

	options: string[] | null;

	tokens?: string[];

	inputElement: ElementHandle;

	helper: Helper;

	userId: string;

	constructor(element: ElementHandle, site: Site) {
		this.inputElement = element;
		this.options = null;
		this.text = null;
		this.site = site;
		this.userId = this.site.userId;
		this.helper = Helper.getInstance(this.site.userId);
	}

	answerFunctions: { [name: string]: any } = {
		text: async (answer: string, inputSelector: string) => {
			await this.helper.clearInput(this.inputElement);
			await this.helper.type(this.inputElement, answer);
		},
		textarea: async (answer: string, inputSelector: string) => {
			await this.helper.clearInput(this.inputElement);
			await this.helper.type(this.inputElement, answer);
		},
		number: async (answer: string, inputSelector: string) => {
			await this.helper.clearInput(this.inputElement);
			await this.helper.type(this.inputElement, answer);
		},
		date: async (answer: string, inputSelector: string) => {
			await this.helper.clearInput(this.inputElement);
			const [year, month, day] = answer.split("-");
			[month, day, year].forEach(async (part) => {
				await this.helper.type(this.inputElement, part);
			});
		},
		radio: async (
			answer: string,
			inputSelector: string,
			optionsSelector: string
		) => {
			const options = await pages[this.userId].$x(optionsSelector);
			for (let i = 0; i < options.length; ++i) {
				if (answer.includes(await this.helper.getElementText(options[i]))) {
					const option = options[i] as ElementHandle<HTMLElement>;
					await option.click();
					return;
				}
			}
			Logger.info("Radio question is falling back...");
			await (options[0] as ElementHandle<HTMLElement>).click();
		},
		select: async (answer: string, inputSelector: string) => {
			await this.helper.type(this.inputElement, answer);
		},
		checkbox: async (
			answer: number | string[],
			inputSelector: string,
			optionsSelector: string
		) => {
			const options = await pages[this.userId].$x(optionsSelector) as ElementHandle<HTMLElement>[];
			const inputs = await pages[this.userId].$x(inputSelector) as ElementHandle<HTMLElement>[];
			// Uncheck any checked boxes
			for (let i = 0; i < options.length; ++i) {
				const checked = await (await inputs[i].getProperty('checked')).jsonValue();
				if (checked) {
					await options[i].click();
				}
			}
			if (options.length === 1) {
				await options[0].click();
				return;
			}
			if (Array.isArray(answer)) {
				for (let i = 0; i < options.length; ++i) {
					if (answer.includes(await this.helper.getElementText(options[i]))) await options[i].click();
				}
				return;
			}
			for (let i = 0; i < options.length; ++i) {
				if (i === answer) {
					await options[i].click();
					return;
				}
			}
			await options[0].click();
		},
	};

	async prepare(): Promise<boolean> {
		this.type = await this.getType();
		this.text = await this.getText();
		this.options = await this.getOptions();
		if (!(this.type && this.text)) {
			Logger.info(
				`Question type, text, and/or options is/are not defined. ${this.type} ${this.text}`
			);
			return false;
		}

		this.tokens = SingletonCategorizer.TokenizeQuestion(this.text);

		return true;
	}

	getInfo() {
		return {
			text: this.text,
			type: this.type,
			options: this.options,
		};
	}

	async answer(answer: string) {
		if (!this.type) throw Error("Type is not defined");
		Logger.info(`Question type: ${this.type}`);

		const { inputSelector, optionsSelector } =
			this.site.questionsInfo[this.type];
		Logger.info(
			`Inputting answer of value ${answer} and type ${typeof answer}
			for input with selector ${inputSelector} and ${optionsSelector}`
		);
		await this.answerFunctions[this.type as string](
			answer.toString(),
			inputSelector.join(","),
			optionsSelector
		);
	}

	async attemptToAnswer() {
		Logger.info(`Attempting to answer question: ${this.text}`);

		let attemptedAnswer: any;

		Logger.info("Attempting to categorize question and answer it.");
		const { category, score, answer } =
			SingletonCategorizer.categorize(this.tokens, this.type);

		Logger.info(`Question category: ${category}, Score: ${score}`);
		if (score > SCORE_THRESHOLD) {
			Logger.info(`Answering question using category ${answer}`);
			attemptedAnswer = answer;
		}

		if (attemptedAnswer) {
			if (this.options) {
				if (this.type === "checkbox" && Array.isArray(attemptedAnswer)) {
					const temp: string[] = [];
					this.options.forEach((option) => {
						attemptedAnswer.every((a: string) => {
							const distance = Natural.JaroWinklerDistance(option, a);
							if (distance > 0.9) {
								temp.push(option);
								return true;
							}
							return false;
						});
					});
					if (temp.length === 0) return false;
					attemptedAnswer = temp;
				} else {
					// Go through options and see if the attempted answer makes sense
					let maxDistance = -Infinity;
					let maxOption = "";
					this.options.forEach((option) => {
						const distance = Natural.JaroWinklerDistance(
							option,
							attemptedAnswer
						);
						if (
							distance > maxDistance ||
							option.toLowerCase().includes(attemptedAnswer.toLowerCase())
						) {
							maxDistance = distance;
							maxOption = option;
						}
					});
					if (maxDistance < 0.9 || maxOption === "") {
						return false;
					}
					attemptedAnswer = maxOption;
				}
			}

			Logger.info(`Attempting answer: ${attemptedAnswer}...`);
			await this.answer(attemptedAnswer);
			Logger.info("Question answered automatically");
			return true;
		}
		return false;
	}

	async getType(): Promise<QuestionTypes | null> {
		for (const enumVal of Object.values(QuestionTypes)) {
			const inputs = await this.inputElement.$$(this.site.questionsInfo[enumVal].inputSelector.join(",")) as ElementHandle[];
			if (inputs.length >= 1) return enumVal;
		}
		return null;
	}

	/**
	 * @returns question text string
	 */
	async getText() {
		if (!this.type) return null;
		const selector = this.site.questionsInfo[this.type].textSelector.join(",");
		const e = await this.inputElement.$(selector) as ElementHandle;
		return await this.helper.getElementText(e);
	}

	async getOptions(): Promise<any[] | null> {
		if (!this.type) {
			return null;
		}

		let options = [];
		try {
			const { optionsSelector } = this.site.questionsInfo[this.type];
			if (!optionsSelector) return null;

			const optionsElements = await pages[this.userId].$x(optionsSelector);

			for (let i = 0; i < optionsElements.length; ++i) {
				const text = await this.helper.getElementText(optionsElements[i]);
				options.push(text);
			}
		} catch (e) {
			Logger.error("ERROR: Couldn't get question options");
			return null;
		}
		if (options.length === 0) {
			Logger.info("This question has no options");
		}
		return options;
	}
}

export default Question;
