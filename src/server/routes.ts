import express from "express";

import { start, stop, getStatus, submitAnswers, init, resume, pause } from "./controllers";

const Route = express.Router();

Route.post("/init", init);

Route.get("/controller/status", getStatus);
Route.get("/controller/resume", resume);
Route.get("/controller/start", start);
Route.get("/controller/pause", pause);
Route.get("/controller/stop", stop);


Route.post("/qa/submitAnswers", submitAnswers);

export default Route;

