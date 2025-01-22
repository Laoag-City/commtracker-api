const fs = require('fs');
require('dotenv').config();

const validateEnv = () => {
  const requiredEnv = ['NODE_ENV', 'MONGO_URI_PROD', 'MONGO_URI_DEV', 'PORT', 'JWT_SECRET'];
  requiredEnv.forEach((envVar) => {
    if (!process.env[envVar]) {
      throw new Error(`Environment variable ${envVar} is missing`);
    }
  });
};

// Validate environment variables
validateEnv();

const config = {
  port: process.env.PORT || (process.env.NODE_ENV === 'production' ? 3086 : 3006),
  mongoUri: process.env.NODE_ENV === 'production' ? process.env.MONGO_URI_PROD : process.env.MONGO_URI_DEV,
  jwtSecret: process.env.JWT_SECRET,
  tlsOptions: process.env.NODE_ENV === 'production' ? {
    cert: fs.readFileSync('/node-tls/fullchain.pem'),
    key: fs.readFileSync('/node-tls/privkey.pem')
  } : null
};

module.exports = config;
