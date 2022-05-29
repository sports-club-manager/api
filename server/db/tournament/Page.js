const mongoose = require("mongoose");

const PageSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        body: { type: String, required: true },
        created: { type: Date, default: Date.now },
    },
    {
        collection: "tournament_pages",
    }
);

module.exports = PageSchema;
