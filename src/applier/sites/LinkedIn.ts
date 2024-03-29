/* eslint-disable import/no-named-as-default */
/* eslint-disable no-restricted-syntax */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable class-methods-use-this */
/* eslint-disable max-classes-per-file */
import { WebDriver, By } from "selenium-webdriver";

import { QnAManager, QuestionInfo } from "../jobapplication";
import { UserData } from "../lib";
import { Locator, Helper } from "../driver";

import { Site } from "./Site";
import SiteCreator from "./SiteCreator";
import server from "../..";

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

		await this.driver.get(
			`https://www.linkedin.com/jobs/search/?${stringSearchParams}`
		);

		await this.enterApplication();
	}

	async enterApplication() {
		let applyNowPressed = false;

		await this.driver.sleep(5000);

		const cards = await this.driver.findElements(
			Site.getBy(this.selectors.smallJobCard)
		);

		for (const card of cards) {
			try {
				if ((await card.getText()).toLowerCase().includes("applied")) continue;
			} catch (e) {
				continue;
			}

			await card.click();

			await this.driver.sleep(3000);

			if (
				(await this.driver.findElements(Site.getBy(this.selectors.applyButton)))
					.length > 0
			) {
				try {
					await this.driver
						.findElement(Site.getBy(this.selectors.applyButton))
						.click();
					await Helper.checkTabs();
				} catch (e) {
					await this.driver.switchTo().defaultContent();
					continue;
				}
				applyNowPressed = true;
				break;
			}
		}

		if (!applyNowPressed) await this.goToJobsPage();
	}

	async answerQuestions() {
		await new QnAManager(this).startWorkflow();
	}
}

export class LinkedInSiteCreator extends SiteCreator {
	public createSite(driver: WebDriver): Site {
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
				by: By.css,
			},
			jobCardBigXpath: {
				selector: "//section[starts-with(@class,'scaffold-layout__detail')]",
				by: By.xpath,
			},
			applyButton: {
				selector: "button.jobs-apply-button",
				by: By.css,
			},
			nextButton: {
				selector:
					"//span[text()[contains(.,'Next') or contains(.,'Review') or contains(.,'Submit application')]]/..",
				by: By.xpath,
			},
			smallJobCard: {
				selector: "ul.scaffold-layout__list-container > li",
				by: By.css,
			},
			companyName: {
				selector: ".jobs-unified-top-card__company-name",
				by: By.css,
			},
			position: {
				selector: ".jobs-unified-top-card__job-title",
				by: By.css,
			},
			signedIn: {
				selector: "#ember15",
				by: By.css,
			},
			textarea: {
				selector: "textarea",
				by: By.css,
			},
			questionsXpathPrefex: {
				selector: "//div[@class='jobs-easy-apply-content']",
				by: By.xpath,
			},
		};
		return new LinkedInSite(driver, selectors, questionsInfo);
	}
}
