const NODE_ENV = process.env.NODE_ENV;
const MONGODB_USER = process.env.MONGODB_USER;
const MONGODB_PASS = process.env.MONGODB_PASS;
const MONGODB_URL = process.env.MONGODB_URL;

let config;

switch (NODE_ENV) {
    case 'production':
        config = {
            MONGODB_URL: `mongodb+srv://${MONGODB_USER}:${MONGODB_PASS}@cluster0.zdg4g.mongodb.net/?retryWrites=true&w=majority`,
            server: {
                port: 5000,
                url: "https://someapp.com"
            }
        }
        break;

    case 'staging':
        config = {
            MONGODB_URL: `mongodb+srv://${MONGODB_USER}:${MONGODB_PASS}@cluster0.zdg4g.mongodb.net/?retryWrites=true&w=majority`,
            server: {
                port: 5002,
                url: "https://someapp.com:5002"
            }
        }
        break;

    case 'development':
    default:
        console.log("ℹ️  Running in development environment");
        config = {
            MONGODB_URL: `mongodb+srv://${MONGODB_USER}:${MONGODB_PASS}@${MONGODB_URL}/?retryWrites=true&w=majority`,
            server: {
                port: 5001,
                url: "http://localhost:5001/"
            }
        }
        break;
}

module.exports = {
    PORT: 3001,
    config
}
