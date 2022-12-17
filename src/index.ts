import express from "express";
import cors from "cors";

import { Logger } from "./applier/lib";
import config from "./server/config";
import Route from "./server/routes";

const PORT = config.app.PORT;
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());

app.use("/api/applier", Route);

const server = app.listen(PORT, () => {
    console.log(`🚀 Applier service started at port ${PORT}`);
});

server.on("questions", async ({ questions }) => {
    try {
        const response = await fetch("0.0.0.0:8000/api/questions", {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(questions),
        });

        console.log(await response.json());
    } catch(e) {
        Logger.error("Something went wrong while sending questions to the main service" + e);
    }
});

server.on("application-submitted", async () => {
    try {
        const response = await fetch("0.0.0.0:8000/api/application/submit", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        console.log(await response.json());
    } catch(e) {
        Logger.error(`Something went wrong while sending application submitted to server`);
    }
})

export default server;
