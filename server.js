const mongoose = require('mongoose');
const dotenv = require('dotenv');

//uncaught exception
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  process.exit(1);
});

//set environment configurations
dotenv.config({ path: './config.env' });

//import app.js
const app = require('./app');

//connect mongoose
const DB = process.env.DATABASE;
mongoose
  .connect(DB, {
    useCreateIndex: true,
    useFindAndModify: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(console.log('db connected'));

//start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log(`Sever started at port: ${PORT}`));

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! 💥 Shutting down...');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    console.log('💥 Process terminated!');
  });
});
