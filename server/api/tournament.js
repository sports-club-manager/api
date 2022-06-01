const baucis = require("baucis");
const logger = require("log4js").getLogger();
const eventbus = require("../lib/eventbus");
const { Tournament, Result, News, Page, Leaguetable } = require("../db/tournament");

module.exports = (io) => {
    eventbus.on("save-news", (newsItem) => {
        logger.debug("Emitting saved newsItem to sockets", newsItem);
        io.sockets.emit("news", newsItem);
    });

    eventbus.on("save-result", (result) => {
        logger.debug("Emitting saved result to sockets", result);
        io.sockets.emit("result", result);

        // search and replace stage2 tag
        if ("stage2Tag" in result && result.stage2Tag !== undefined) {
            logger.debug(`Searching for stage 2 target ${result.stage2Tag}`);
            var winner = result.homeTeam;
            if (result.awayPens > result.homePens || result.awayGoals > result.homeGoals) {
                winner = result.awayTeam;
            }
            updateStageTwo(result.stage2Tag, winner);
        }
    });

    eventbus.on("remove-result", (result) => {
        logger.debug("Emitting deleted result to sockets", result);
        io.sockets.emit("remove", result);
    });

    const updateStageTwo = (source, target) => {
        const cb = (err, res) => {
            if (err) {
                logger.error(err);
            }
        };

        logger.debug(`Updating ${source} to ${target}`);
        Result.updateMany({ homeTeamFrom: source }, { $set: { homeTeam: target } }, cb);
        Result.updateMany({ awayTeamFrom: source }, { $set: { awayTeam: target } }, cb);
        Result.find({ $or: [{ homeTeamFrom: source }, { awayTeamFrom: source }] }, (err, docs) => {
            if (err) {
                logger.error(err);
            }
            for (var i = 0; i < docs.length; i++) {
                logger.debug(`Emiting updated stage2 result ${JSON.stringify(docs[i])}`);
                io.sockets.emit("result", docs[i]);
            }
        });
    };

    Tournament.locking(true);
    Result.locking(true);

    baucis.rest(Tournament).methods("delete", false);
    baucis.rest(Result);
    baucis.rest(Page);
    baucis.rest(News);

    /*
     * post a league table so that 2nd stage games can be worked out.  Body should contain
     * an array of team names in the order they finished in the table; i.e.
     *
     * req.body == ["Sheff. Wed.", "Ipswich", "Cardiff", "Leeds", "Rotherham"]
     */
    baucis.rest(Leaguetable).post("/:competition/:section/:group", (req, res) => {
        let prefix = `${req.params.competition}_${req.params.section}_G${req.params.group}_P`;
        logger.debug(`Resolving stage 2 placeholders for ${prefix} and team names ${JSON.stringify(req.body)}`);

        for (let k in req.body) {
            if (req.body.hasOwnProperty(k) && !isNaN(k)) {
                let source = prefix + (parseInt(k) + 1);
                updateStageTwo(source, req.body[k]);
            }
        }

        res.sendStatus(200);
    });

    return baucis();
};
