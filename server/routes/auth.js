const router = require("express").Router();
const logger = require("log4js").getLogger();
const passport = require("passport");
const { buildTokenFor } = require("../lib/auth");

// --------------------------------------------------------------------------
// google auth
// --------------------------------------------------------------------------
router.get("/login/google", passport.authenticate("google", { scope: ["profile", "email"] }));

router.get(
    "/login/google/callback",
    passport.authenticate("google", { failureRedirect: "login/failed", session: false }),
    (req, res) => {
        logger.debug("User returned from login request", req.user);
        let token = buildTokenFor(req.user);
        res.type("application/json").json({ token: token });
    }
);

// --------------------------------------------------------------------------
// common
// --------------------------------------------------------------------------
router.get("/logout", (req, res) => {
    logger.debug("Logging out");
    req.logout();
    res.redirect("/");
});

router.get("/login/failed", (req, res) => {
    const err = new Error("Failed to authenticate");
    err.status = 401;
    next(err);
});

router.get("/", (req, res) => {
    res.type("application/json").json({ application: "auth-api" });
});

module.exports = router;
