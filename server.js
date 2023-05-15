require("dotenv").config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const mongoose = require("mongoose");
const cors = require("cors");
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  next();
});
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

app.use("/user", require("./routes/user"));

//Database connection
mongoose.connect(process.env.DATABASE, {
  useUnifiedTopology: true,
  useNewUrlParser: true,
});
mongoose.connection.on("error", (error) => {
  console.err("Mongoose Connection Error: " + error.message);
});
mongoose.connection.once("open", () => {
  console.log("Mongodb connected!");
});

server.listen(PORT, () => {
  console.log("server is running on port " + PORT);
});
