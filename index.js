const https = require('https');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const config = require('./config');
const logger = require('./utils/logger');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/users', userRoutes);
app.use('/departments', departmentRoutes);

app.get('/', (req, res) => {
  res.send('Laoag City Communications Tracking APi Server. Docs at <a href="https://apps.laoagcity.gov.ph/apidocs/commtracker">API Docs</a>');
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
      app.listen(config.port, () => {
      logger.info(`Server is up and running on port ${config.port}`);
      });
    }
  })
  .catch((err) => {
    logger.error('Error connecting to MongoDB:', { message: err.message, stack: err.stack });
  });
