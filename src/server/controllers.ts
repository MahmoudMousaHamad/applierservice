import { validationResult } from "express-validator";
import { Request, Response } from "express";

import { Logger } from "../applier/lib";
import Applier from "../applier";
import server from "../index";

const applier = new Applier();

const controllerTemplate = (controller: Function) => {
    return async (req: Request, res: Response) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({
                errors: errors.array()
            });
        }
        try {
            await controller(req, res);
        } catch (e) {
            Logger.error(e);
            res.status(500).send("Error! Error details: " + e);
        }
    }
}

const start = async (req: Request, res: Response) => {
    await applier.start(req.query, req.query.answers, res);
};

const stop = controllerTemplate(async (req: Request, res: Response) => {
    await applier.stop(res);
});

const pause = async (req: Request, res: Response) => {
    await applier.pause(res);
};

const resume = async (req: Request, res: Response) => {
    await applier.resume(res);
};

const getStatus = controllerTemplate(async (req: Request, res: Response) => {
    res.status(200).json({
        status: applier.getStatus(),
    });
});

const submitAnswers = controllerTemplate(async (req: Request, res: Response) => {
    server.emit("answers", req.body.answers);
});

const init = controllerTemplate(async (req: Request, res: Response) => {
    server.emit("userInfo", req.body.userInfo);
});

export { start, stop, getStatus, submitAnswers, init, pause, resume };
