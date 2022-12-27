import { QnAManager, QuestionInfo } from "../jobapplication";
import { UserData } from "../lib";
import { Locator, Helper } from "../driver";

import SiteCreator from "./SiteCreator";
import { Site } from "./Site";
import {server} from "../..";
import { ElementHandle } from "puppeteer";

export class LinkedInSite extends Site {
	locationsAndActions = {
		resume: {
			strings: ["Be sure to include an updated resume"],
			type: Locator.TEXT,
			action: this.resumeSection.bind(this),
		},
		questions: {
			strings: ["Contact info", "Additional Questions", "Work authorization"],
			type: Locator.TEXT,
			action: this.answerQuestions.bind(this),
		},
		review: {
			strings: ["Review your application", "Submit application"],
			type: Locator.TEXT,
			action: this.submitApplication.bind(this),
		},
		submitted: {
			strings: ["Your application was sent"],
			type: Locator.TEXT,
			action: async () => {
				server.emit("application-submitted");
				await this.goToJobsPage();
				this.submittedDate = new Date();
			},
		},
	};

	async goToJobsPage(): Promise<void> {
		const LinkedInSearchParamsMapper: {
			[name: string]: { [name: string]: string };
		} = {
			type: {
				internship: "I",
				fulltime: "F",
				parttime: "P",
				temporary: "T",
				contract: "C",
				volunteer: "V",
			},
			experience: {
				INTERNSHIP: "1",
				ENTRY_LEVEL: "2",
				ASSOCIATE: "3",
				MID_LEVEL: "4",
				SENIOR_LEVEL: "4",
				DIRECTOR: "5",
				EXECUTIVE: "6",
			},
		};

		const location =
			UserData.locations[
				Math.floor(Math.random() * UserData.locations.length)
			];

		const title =
			UserData.titles[
				Math.floor(Math.random() * UserData.titles.length)
			];

		const jobSearchParams = {
			autoApply: {
				name: "f_AL",
				value: "true",
			},
			experience: {
				name: "f_E",
				value:
					LinkedInSearchParamsMapper.experience[
						UserData.experienceLevel
					],
			},
			type: {
				name: "f_JT",
				value: LinkedInSearchParamsMapper.type[UserData.jobType],
			},
			location: {
				name: "location",
				value: location,
			},
			title: {
				name: "keywords",
				value: encodeURIComponent(title),
			},
		};

		const stringSearchParams = Object.entries(jobSearchParams)
			.map(([, { name, value }]) => `${name}=${value}`)
			.join("&");

		await globalThis.page.goto(`https://www.linkedin.com/jobs/search/?${stringSearchParams}`, 
			{ waitUntil: "networkidle0" } 
		);
	}

	async signin(): Promise<boolean> {
		await page.goto('https://indeed.com');
	    const [button] = await page.$x("//a[contains(text(),'Sign in')]") as ElementHandle[];
		await button.click();
		await Helper.sleep(1000);
	    const [googleBtn] = await page.$x("//button[contains(text(),'Google')]") as ElementHandle[];
		await googleBtn.click();
		return true;
	}

	async answerQuestions() {
		await new QnAManager(this).startWorkflow();
	}
}

export class LinkedInSiteCreator extends SiteCreator {
	public createSite(): Site {
		const questionsInfo = super.getQuestionsInfo();
		questionsInfo.radio = new QuestionInfo(
			"radio",
			"input[type=radio]",
			"legend",
			".//*[@data-test-fb-radio-display-text='true']"
		);
		const selectors = {
			errors: {
				selector: "#todo-change-me",
				xpath: false,
			},
			jobCardBigXpath: {
				selector: "//section[starts-with(@class,'scaffold-layout__detail')]",
				xpath: true,
			},
			applyButton: {
				// selector: "button.jobs-apply-button",
				selector: "//span[text()[contains(.,'Easy Apply')]]/..",
				xpath: true,
			},
			nextButton: {
				selector:
					"//span[text()[contains(.,'Next') or contains(.,'Review') or contains(.,'Submit application')]]/..",
				xpath: true,
			},
			cards: {
				selector: "ul.scaffold-layout__list-container > li",
				xpath: false,
			},
			companyName: {
				selector: ".jobs-unified-top-card__company-name",
				xpath: false,
			},
			position: {
				selector: ".jobs-unified-top-card__job-title",
				xpath: false,
			},
			signedIn: {
				selector: "#ember15",
				xpath: false,
			},
			textarea: {
				selector: "textarea",
				xpath: false,
			},
			questionsXpathPrefex: {
				selector: "//div[@class='jobs-easy-apply-content']",
				xpath: true,
			},
		};
		return new LinkedInSite(selectors, questionsInfo);
	}
}
