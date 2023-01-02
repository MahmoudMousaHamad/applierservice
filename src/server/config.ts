const NODE_ENV = process.env.NODE_ENV;

let config: { serverEndpoint: string, PORT: number };

switch (NODE_ENV) {
    case 'production':
        config = {
            serverEndpoint: 'http://useapplier.com/',
            PORT: 3001,
        }
        break;

    case 'staging':
        config = {
            serverEndpoint: 'http://useapplier.com/',
            PORT: 3001,
        }
        break;

    case 'development':
    default:
        console.log("ℹ️  Running in development environment");
        config = {
            serverEndpoint: 'http://172.19.0.2:3000/',
            PORT: 3001,
        }
        break;
}

export default config;
