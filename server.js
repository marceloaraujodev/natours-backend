const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

process.on('uncaughtException', err => {
  // console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  // console.log(err.name, err.message);
  process.exit(1);
});

const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose.connect(DB).then(() => console.log('DB connection successful'))

// Start Server
const port = process.env.PORT || 3000;
const server = app.listen(port, () => console.log(`Listening on port:${port}`));

process.on('unhandledRejection', err => {
  console.log('UNHANDLED REJECTION!💥 Shutting down...');
  console.log(err.name, err.message);
  // best practice close the server then kill the server closing everything.
  server.close(() => {
    // 0 is for success and 1 for uncaught exception
    process.exit(1);
  });
});


