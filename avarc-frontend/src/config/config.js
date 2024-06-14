
var config = {
  environment: 'dockerized',
  apiUrl: 'http://localhost:9696/api',
  debug: true,
};

config.environment = process.env.REACT_APP_ENV;
config.debug = process.env.REACT_APP_DEBUG === true;
config.apiUrl = process.env.REACT_APP_API_URL;

export default config;
