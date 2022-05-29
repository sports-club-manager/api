const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        providerId: String,
        providerName: String,
        email: String,
        photo: String,
        displayName: String,
        roles: [String],
    },
    {
        collection: "auth_users",
    }
);

module.exports = UserSchema;
