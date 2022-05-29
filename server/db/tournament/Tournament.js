const mongoose = require("mongoose");

const CompetitionSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        section: { type: String, required: true },
        groups: { type: Number, default: 0 },
    },
    {
        id: false,
    }
);

const TournamentSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        description: String,
        club: String,
        siteUrl: String,
        competitions: [CompetitionSchema],
    },
    {
        collection: "tournament_tournaments",
    }
);

module.exports = TournamentSchema;
