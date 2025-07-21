const https = require('https');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');  // Import Helmet
const userRoutes = require('./routes/User');
const departmentRoutes = require('./routes/Department');
const groupRoutes = require('./routes/Group');
const trackerRoutes = require('./routes/Tracker');
const reportRoutes = require('./routes/Report'); // Import Report routes
const config = require('./config');
const logger = require('./utils/logger');

const app = express();

// Trust specific proxy IPs
app.set('trust proxy', [
  '153.92.5.114',
  '58.69.52.182',
  '58.69.52.183',
  '58.69.52.190',
  '124.106.102.171',
  '::1',
]);

// CORS configuration
const corsOptions = {
  origin: [
    'https://commtracker.laoagcity.gov.ph',
    'https://laoagcity.gov.ph',
    'http://localhost',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};
app.use(cors(corsOptions));

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        frameAncestors: ["'self'", 'laoagcity.gov.ph', 'localhost'],
      },
    },
    strictTransportSecurity: {
      maxAge: 31536000,
      includeSubDomains: true,
    },
  })
);

// Middleware
//app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/users', userRoutes);
app.use('/departments', departmentRoutes);
app.use('/groups', groupRoutes);
app.use('/trackers', trackerRoutes); // Tracker routes
app.use('/reports', reportRoutes); // Report routes

app.get('/', (req, res) => {
  res.send('Laoag City Communications Tracking ReST API Server. Docs at <a href="https://apps.laoagcity.gov.ph/apidocs/comm-tracker">API Docs</a>');
});

mongoose.connect(config.mongoUri, {})
  .then(() => {
    logger.info(`${process.env.NODE_ENV} environment`);
    //logger.info('Connected to MongoDB', { mongoUri: config.mongoUri });
    logger.info('Connected to MongoDB');

    if (process.env.NODE_ENV === 'production') {
      https.createServer(config.tlsOptions, app).listen(config.port, () => {
        logger.info(`Server is up and running on port ${config.port} with TLS`);
      });
    } else {
      app.listen(config.port, '0.0.0.0', () => {
        logger.info(`Server is up and running on port ${config.port}`);
      });
    }
  })
  .catch((err) => {
    logger.error('Error connecting to MongoDB:', { message: err.message, stack: err.stack });
  });
