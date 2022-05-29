const logger = require("log4js").getLogger();
const mongoose = require("mongoose");
const mongoUri = process.env.API_MONGO_URI || "mongodb://localhost/stbgfc-test";
const mongoOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
};

(async () => {
    try {
        await mongoose.connect(mongoUri, mongoOptions);
    } catch (err) {
        logger.error(err);
    }
})();

mongoose.connection.on("connected", () => {
    logger.info("Mongoose connected to", mongoUri);
});

mongoose.connection.on("error", (err) => {
    logger.error("Mongoose connection error: " + err);
});

mongoose.connection.on("disconnected", () => {
    logger.warn("Mongoose disconnection event");
});

mongoose.connection.on("reconnected", () => {
    logger.warn("Mongoose reconnection event");
});

const dbShutdown = (msg, callback) => {
    mongoose.connection.close(() => {
        logger.debug("Mongoose disconnected through " + msg);
        callback();
    });
};

module.exports = {
    //mongoose: mongoose,
    dbShutdown: dbShutdown,
};
