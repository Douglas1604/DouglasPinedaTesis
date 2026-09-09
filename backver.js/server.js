const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const logger = require("morgan");
const cors = require("cors");
const passport = require("passport");
const swaggerRouter = require("./swagger");

/**Routes import */
const apiRouter = require("./routes/api");

// Ports server
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(passport.initialize());
require("./config/passport")(passport);
app.disable("x-powered-by");
app.set("PORT", PORT);
app.use(express.static("public"));


/** Calling Routes */
app.use("/api/v1", apiRouter);
// Swagger
app.use("/api-docs", swaggerRouter);

server.listen(PORT, "192.168.1.29" || "localhost", function () {
  console.log(`Server running on port ${PORT}`);
});

/** Routes */
app.get("/", (req, res) => {
  res.send("Route point from backend server working");
});

// Messages from server errors
app.use((err, req, res, next) => {
  console.log(err);
  res
    .status(err.status || 500)
    .send({ message: err.message, status: err.status });
});
