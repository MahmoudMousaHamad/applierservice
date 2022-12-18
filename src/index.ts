import express from "express";
import axios from "axios";
import cors from "cors";

import { Logger } from "./applier/lib";
import config  from "./server/config";
import Route from "./server/routes";

let userInfo: { id: string };
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/api/applier", Route);

const server = app.listen(config.PORT, () => {
    Logger.info(`🚀 Applier service started at port ${config.PORT}`);
    Logger.info(`Main server endpoint is ${config.serverEndpoint}`);
});

server.on("init", (info: {id: string}) => {
    userInfo = info;
});

server.on("questions", async (questions) => {
    try {
        const response = await axios.post(`${config.serverEndpoint}api/questions`, {
            questions: JSON.stringify(questions),
            userId: userInfo.id,
        });
        console.log(response.status);
    } catch(e) {
        Logger.error("Something went wrong while sending questions to the main service. \
        Error details: " + e);
    }
});

server.on("application-submitted", async () => {
    try {
        if (!userInfo) throw Error("User info was not initialized");
        const response = await axios.post(`${config.serverEndpoint}api/applications/updateCount`, {
            userId: userInfo.id,
        });
        console.log(response.status);
    } catch(e) {
        Logger.error(`Something went wrong while sending application submitted to main service. 
        Error details: ${e}`);
    }
})

export default server;
