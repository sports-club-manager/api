const mongoose = require("mongoose");
const logger = require("log4js").getLogger("db");
const eventbus = require("../../lib/eventbus");

const NewsSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
        created: { type: Date, default: Date.now },
    },
    {
        collection: "tournament_news",
    }
);

// add tournament middleware to schema
NewsSchema.post("save", (newsItem) => {
    logger.debug("Mongoose saved newsItem", newsItem._id);
    eventbus.emit("save-news", newsItem);
});

module.exports = NewsSchema;
