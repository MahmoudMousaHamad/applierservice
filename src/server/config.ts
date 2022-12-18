const NODE_ENV = process.env.NODE_ENV;

let config: { serverEndpoint: string, PORT: number };

switch (NODE_ENV) {
    case 'production':
        config = {
            serverEndpoint: 'http://167.172.133.156/',
            PORT: 3000,
        }
        break;

    case 'staging':
        config = {
            serverEndpoint: 'http://167.172.133.156/',
            PORT: 3000,
        }
        break;

    case 'development':
    default:
        console.log("ℹ️  Running in development environment");
        config = {
            serverEndpoint: 'localhost:3000/',
            PORT: 3001,
        }
        break;
}

export default config;
