const mongoose = require("mongoose");
const moment = require("moment-timezone");
const logger = require("log4js").getLogger("db");
const eventbus = require("../../lib/eventbus");

const ResultSchema = new mongoose.Schema(
    {
        competition: {
            name: { type: String, required: true },
            section: { type: String, required: true },
            group: { type: Number, min: 1 },
        },
        tag: { type: String, required: true },
        day: { type: Number, required: true },
        dateTime: { type: Number, required: true },
        pitch: { type: String },
        homeTeam: { type: String, required: true },
        awayTeam: { type: String, required: true },
        homeGoals: { type: Number, min: 0 },
        awayGoals: { type: Number, min: 0 },
        homePens: { type: Number, min: 0 },
        awayPens: { type: Number, min: 0 },

        // 'hidden' props
        stage2Tag: { type: String },
        homeTeamFrom: { type: String },
        awayTeamFrom: { type: String },
    },
    {
        toObject: { virtuals: true },
        toJSON: { virtuals: true },
        optimisticConcurrency: true,
        collection: "tournament_results",
    }
);

ResultSchema.virtual("time").get(function () {
    return new moment(this.dateTime).tz(process.env.TIME_ZONE || "Europe/London").format("HH:mm");
});

ResultSchema.virtual("homeScore").get(function () {
    if ("homeGoals" in this && this.homeGoals >= 0) {
        return this.homeGoals + (this.awayPens || this.homePens ? "(" + this.homePens + ")" : "");
    } else {
        return "";
    }
});

ResultSchema.virtual("awayScore").get(function () {
    if ("awayGoals" in this && this.awayGoals >= 0) {
        return (this.awayPens || this.homePens ? "(" + this.awayPens + ")" : "") + this.awayGoals;
    } else {
        return "";
    }
});

ResultSchema.post("save", (result) => {
    logger.debug("Mongoose saved result", result._id);
    eventbus.emit("save-result", result);
});

ResultSchema.post("remove", function (result) {
    logger.debug("Mongoose deleted result", result._id);
    eventbus.emit("remove-result", result);
});

module.exports = ResultSchema;
