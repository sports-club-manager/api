const mongoose = require("mongoose");

module.exports = {
    Tournament: mongoose.model("Tournament", require("./Tournament")),
    Result: mongoose.model("Result", require("./Result")),
    News: mongoose.model("News", require("./News")),
    Page: mongoose.model("Page", require("./Page")),
    Leaguetable: mongoose.model("Leaguetable", new mongoose.Schema({})),
};
