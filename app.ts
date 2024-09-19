import express, { Application } from "express";
import dotenv from "dotenv";
import { Pool } from "pg";
import userRoutes from "./src/Routes/userRoutes";
import UserController from "./src/Controller/userController";
import ticketRoutes from "./src/Routes/ticketRoutes";
import TicketController from "./src/Controller/ticketController";
import TicketAanalyticsController from "./src/Controller/ticketAnalyticsController";
import LogController from "./src/Controller/logController";
import logMiddleware from "./src/Middleware/logMiddleware";

//Loadin the environment variables from the .env file
dotenv.config();

const app: Application = express();
const port = process.env.PORT || 5000;

//Middleware to parse the JSON
app.use(express.json());

//Setting up POSTGRES databse connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT || "5432"),
});

// Initialize the pool in UserController
UserController.initializePool(pool);
TicketController.initializePool(pool);
TicketAanalyticsController.initializePool(pool);
LogController.initializePool(pool);

// Use log middleware to log every incoming request
app.use(logMiddleware);

// Setting up the routes
app.use("/api", userRoutes);
app.use("/api", ticketRoutes);

//Startin the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

//Testing if server is running or not
app.get("/", (req, res) => {
  res.send("Hello the server is running!!");
});
