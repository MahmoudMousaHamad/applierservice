import { Response } from "express";

import { IndeedSiteCreator, LinkedInSiteCreator, Status } from "./sites";
import { Logger, UserData } from "./lib";
import { Driver, killDriverProcess } from "./driver";

import { SingletonCategorizer } from "./lib/Categorizer";

class Applier {
    private linkedin: LinkedInSiteCreator;

    private indeed: IndeedSiteCreator;

    private driver: Driver;

    constructor () {
        this.linkedin = new LinkedInSiteCreator();
        this.indeed = new IndeedSiteCreator();
        this.driver = new Driver(this.linkedin);
    }

    async start(userData: any, answers: any, res: Response) {
        Logger.info(`Site: ${userData?.site}`);
		if (userData.site === "INDEED") this.driver = new Driver(this.indeed);
		else this.driver = new Driver(this.linkedin);

		UserData.set(userData);
		SingletonCategorizer.load(answers);

        res.status(200).json({
            status: Status.RUNNING,
        });

        await this.driver.start();
    }

    async stop(res: Response) {
        Logger.info("Stopping applier 1");
		await this.driver.stop();
		await killDriverProcess();
        res.status(200).json({
            answers: JSON.stringify(SingletonCategorizer.categorizer),
            status: this.getStatus(),
        });
    }

    getStatus(): Status {
        return this.driver.getStatus();
    }
}

export default Applier;
