import request from "supertest";

import { app, server } from "../src";
import { SiteCreator } from "../src/applier/sites";

const configURL = "/api/applier/config";
const BASE_URL = "/api/applier/";

const userData = {
    coverLetter: "To whom it may concern...",
    titles: ["Software Engineer"],
    experienceLevel: "entryLevel",
    locations: ["United States"],
    jobType: "fulltime",
    userId: "test",
    site: "INDEED",
    answers: {
        "sponsorship": {
            "keywords": ["visa","sponsorship"],
            "answer": "Yes",
            "type": "radio"
        }
    }
};

const r = request(app);

beforeAll(() => {
    jest.spyOn(SiteCreator.prototype, 'start').mockImplementation(async () => {});
});

afterAll(() => {
    server.close();
    jest.restoreAllMocks();
});


describe("GET " + configURL, () => {
    it("should set address and IP of main service for communication", async () => {
        await r.post(configURL).send({ 
            address: "172.0.0.2",
            port: "3000",
        }).expect(200);
    });
    it("should raise an error if address is not defined", async () => {
        await r.post(configURL).send({ port: "3000" }).expect(500);
    });
    it("should raise an error if port is not defined", async () => {
        await r.post(configURL).send({ address: "172.0.0.2" }).expect(500);
    });
});

describe(`GET ${BASE_URL}controller/start`, () => {
    it("should start the applier service", async () => {
        await r.get(`${BASE_URL}controller/start`).send(userData).expect(200);
    });
    it("should return 403 if user options are invalid (titles missing)", async () => {
        await r.get(`${BASE_URL}controller/start`).send({...userData, titles: undefined}).expect(403);
    });
});

describe(`GET ${BASE_URL}controller/status`, () => {
    it("should return {status: 1} after starting", async () => {
        await r.get(`${BASE_URL}controller/start`).send(userData).expect(200);
        const res = await r.get(`${BASE_URL}controller/status`);
        expect(res.status).toBe(200);
    });
});
