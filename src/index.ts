import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";
import { logger } from "./logger.js";


dotenv.config({
  path: "./env",
});

// console.log(process.env.PORT);
function startServer(port: number) {
  const server = app.listen(port, () => {
    logger.info(`Server is running on Port ${port}`)
  });
  server.on('error', (err: Error) => {
    if ((err as any).syscall !== 'listen') {
      throw err;
    }
    // handle specific listen errors with friendly messages
    switch ((err as any).code) {
      case 'EACCES':
        console.error(`Port ${port} requires elevated privileges`);
        process.exit(1);
        break;
      case 'EADDRINUSE':
        console.log(`Port ${port} is already in use.`);
        console.log(`Trying ${port + 1}`);
        // Retry with a different port
        startServer(port + 1);
        break;
      default:
        throw err;
    }
  });
}

connectDB()
  .then(() => {
   
    startServer(Number(process.env.PORT) || 3000)
    // app.listen(process.env.PORT || 4000, () => {
    //   console.log("Server is started successfully on port: ", process.env.PORT);
    // });
    // app.on("error", (err) => {
    //   console.log("server failed to start ", err);
    // });
  })
  .catch((err) => {
    // console.log("Mongodb connection failed !!!", err);
    logger.error(`Error starting server`, err)
  });
