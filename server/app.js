require("dotenv").config();

const logger = require("log4js").getLogger();
const morgan = require("morgan");
const path = require("path");
const passport = require("passport");
const { createServer } = require("http");
const express = require("express");
const app = express();
const httpServer = createServer(app);
const { Server } = require("socket.io");
const io = new Server(httpServer, { cors: { origin: [process.env.API_IO_CORS_ORIGIN || "http://localhost:3000"] } });
const tournamentApi = require("./api/tournament")(io);
const acl = require("./lib/rbac").acl;
const auth = require("./lib/auth");

// --------------------------------------------------------------------------
// APP SETUP
// --------------------------------------------------------------------------
logger.level = process.env.API_LOGGER_LEVEL || "warn";
acl.logger = logger;
auth.init(passport, "auth");

app.use(require("helmet")());
app.use(require("cors")({ origin: process.env.API_CORS_ORIGIN || "*" }));
app.use(passport.initialize());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    morgan(process.env.API_HTTP_LOG_FORMAT || "dev", {
        stream: {
            write: (str) => {
                logger.info(str);
            },
        },
    })
);
io.on("connection", (socket) => {
    logger.debug("New socket connection from ", socket.id);
});

// --------------------------------------------------------------------------
// ROUTES
// --------------------------------------------------------------------------
app.use("/auth", require("./routes/auth"));
app.use("/tournament", [acl.middleware(2, auth.getUserId)], tournamentApi);

// fallback - 404
app.use((req, res, next) => {
    const err = new Error("Not Found");
    err.errorCode = 404;
    next(err);
});

// error handler
app.use((err, req, res, next) => {
    let e = app.get("env") === "development" ? err : {};
    logger.error(err.message);
    res.status(err.status || err.errorCode || 500).json({
        message: err.message,
        error: e,
    });
});

// --------------------------------------------------------------------------
// termination handlers
// --------------------------------------------------------------------------
const { dbShutdown } = require("./db");

// nodemon restarts
process.once("SIGUSR2", () => {
    dbShutdown("nodemon restart", () => {
        process.kill(process.pid, "SIGUSR2");
    });
});

// app termination
process.on("SIGINT", () => {
    dbShutdown("SIGINT app termination", () => {
        process.exit(0);
    });
});

process.on("SIGTERM", () => {
    dbShutdown("SIGTERM app termination", () => {
        process.exit(0);
    });
});

// --------------------------------------------------------------------------
// Go!
// --------------------------------------------------------------------------
const port = process.env.API_PORT || 3000;
httpServer.listen(port, "0.0.0.0");
logger.debug(`Running on port ${port}`);

module.exports = {
    app: app,
};
