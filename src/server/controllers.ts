import { validationResult } from "express-validator";
import { Request, Response } from "express";
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
            console.error(e);
            res.status(500).send("Error! Error details: " + e);
        }
    }
}

const start = controllerTemplate(async (req: Request, res: Response) => {
    await applier.start(req.query, req.query.answers, res);
});

const stop = controllerTemplate(async (req: Request, res: Response) => {
    await applier.stop(res);
});

const getStatus = controllerTemplate(async (req: Request, res: Response) => {
    res.status(200).json({
        status: applier.getStatus(),
    });
});

const submitAnswers = controllerTemplate(async (req: Request, res: Response) => {
    server.emit("answers", req.body.answers);
});

export { start, stop, getStatus, submitAnswers };
