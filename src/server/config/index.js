import app from "./app";

const JWT_SECRET = process.env.JWT_SECRET;

const config = {
    app,
    cors: {
        corsWhitelist: ['http://localhost:1212', 'http://localhost:3000', 'http://167.172.133.156', 'http://172.18.0.1:3000', "*"]
    },
    auth: {
        secret: JWT_SECRET || "my-secret-key",
    },
    // db: {
    //     connect: require('./db')
    // },
}

export default config;
