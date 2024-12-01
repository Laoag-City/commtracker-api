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
const config = require('./config');
const logger = require('./utils/logger');

const app = express();
// Use Helmet to secure HTTP headers
/* app.use( 
  helmet({ 
    contentSecurityPolicy: { directives: { "script-src": ["'self'", "laoagcity.gov.ph", "localhost"], 
      }, 
    },
  }), 
); [4]
 */
 app.use(helmet(
  helmet({
    contentSecurityPolicy: {
      directives: {
        // Allow framing from self and specific domain
        frameAncestors: ["'self'", "laoagcity.gov.ph/", "localhost"],
      },
    },
  })
));

/*
app.use(helmet({
  contentSecurityPolicy: false,  // Example: Disable CSP if needed for your app
  // You can customize other security headers here
}));
*/

app.use(cors());
app.use(bodyParser.json());

app.use('/users', userRoutes);
app.use('/departments', departmentRoutes);
app.use('/groups', groupRoutes);
app.use('/trackers', trackerRoutes); // Tracker routes

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
      app.listen(config.port, () => {
      logger.info(`Server is up and running on port ${config.port}`);
      });
    }
  })
  .catch((err) => {
    logger.error('Error connecting to MongoDB:', { message: err.message, stack: err.stack });
  });
