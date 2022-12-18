import { Response } from "express";

import { IndeedSiteCreator, LinkedInSiteCreator, Status } from "./sites";
import { Logger, UserData } from "./lib";
import { downloadChromeDriver, Driver, killDriverProcess } from "./driver";

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
        if (this.driver.getStatus() !== Status.RUNNING) {
            await downloadChromeDriver();
            Logger.info(`Site: ${userData?.site}`);
            if (userData.site === "INDEED") this.driver = new Driver(this.indeed);
            else this.driver = new Driver(this.linkedin);

            UserData.set(userData);
            SingletonCategorizer.load(answers);

            res.status(200).json({
                status: Status.RUNNING,
            });

            await this.driver.start();
        } else {
            res.status(500).json({
                status: Status.RUNNING,
                error: "Applier is already running"
            });
        }
    }

    async stop(res: Response) {
		await this.driver.stop();
		await killDriverProcess();
        res.status(200).json({
            answers: JSON.stringify(SingletonCategorizer.categorizer),
            status: this.getStatus(),
        });
    }

    async pause(res: Response) {
        if (this.driver.getStatus() === Status.RUNNING) {
            res.status(200).json({
                status: Status.PAUSED,
            });
            await this.driver.pause();
        } else {
            res.status(500).json({
                error: "Pause is not possible; the applier service is not running."
            });
        }
    }

    async resume(res: Response) {
        if (this.driver.getStatus() === Status.PAUSED) {
            await this.driver.resume();
            res.status(200).json({
                status: this.getStatus(),
            });
        } else {
            res.status(500).json({
                error: "Resume is not possible; the applier service is not paused."
            });
        }
    }

    getStatus(): Status {
        return this.driver.getStatus();
    }
}

export default Applier;
