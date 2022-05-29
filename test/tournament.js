require("dotenv").config();
var request = require("supertest");
var assert = require("assert");
var app = require("../server/app").app;

describe("When using the Tournament API", () => {
    var newResult = {
        homeTeam: "Foo",
        awayTeam: "Bar",
        competition: {
            name: "U11",
            section: "B",
            group: 2,
        },
        pitch: "11",
        tag: "TST",
        day: 1,
        dateTime: 45100000,
        index: 50,
    };

    /* common authz */

    var authHeader = () => {
        return latestBearerToken !== "" ? "Authorization" : "Dummy";
    };

    var checkCreate = (uri, payload, code, done) => {
        request(app)
            .post(uri)
            .set(authHeader(), "Bearer " + latestBearerToken)
            .send(payload)
            .expect(code, done);
    };
    var checkRead = (uri, code, done) => {
        request(app)
            .get(uri)
            .set(authHeader(), "Bearer " + latestBearerToken)
            .expect(code, done);
    };
    var checkUpdate = (uri, payload, code, done) => {
        request(app)
            .put(uri)
            .set(authHeader(), "Bearer " + latestBearerToken)
            .send(payload)
            .expect(code, done);
    };
    var checkDelete = (uri, payload, code, done) => {
        request(app)
            .delete(uri)
            .set(authHeader(), "Bearer " + latestBearerToken)
            .expect(code, done);
    };

    describe("a normal user", () => {
        before(() => {
            latestBearerToken = "";
        });

        it("should not see the x-powered-by header", (done) => {
            request(app)
                .get("/foo")
                .expect((res) => {
                    if ("x-powered-by" in res.header) {
                        throw new Error("x-powered-by is visible");
                    }
                })
                .expect(404, done);
        });

        it("cannot create tournament data", (done) => {
            checkCreate("/tournament/tournaments", {}, 403, done);
        });

        it("cannot update tournament data", (done) => {
            checkUpdate("/tournament/tournaments", {}, 403, done);
        });

        it("cannot delete tournament data", (done) => {
            checkDelete("/tournament/tournaments", {}, 403, done);
        });

        it("cannot create results", (done) => {
            checkCreate("/tournament/results", newResult, 403, done);
        });

        it("cannot update results", (done) => {
            checkUpdate("/tournament/results", {}, 403, done);
        });

        it("cannot delete results", (done) => {
            checkDelete("/tournament/results", {}, 403, done);
        });

        it("can read tournament data", (done) => {
            checkRead("/tournament/tournaments", 200, done);
        });

        it("can read results", (done) => {
            checkRead("/tournament/results", 200, done);
        });

        it("can search for results by competition", (done) => {
            checkRead(
                "/tournament/results?conditions=%7B%22competition.name%22:%22U11%22,%22competition.section%22:%22A%22%7D",
                200,
                done
            );
        });

        it("cannot create news", (done) => {
            checkCreate("/tournament/news", {}, 403, done);
        });

        it("can read news", (done) => {
            checkRead("/tournament/news", 200, done);
        });

        it("cannot update news", (done) => {
            checkUpdate("/tournament/news", {}, 403, done);
        });

        it("cannot delete news", (done) => {
            checkDelete("/tournament/news", {}, 403, done);
        });
    });

    describe("a referee", () => {
        before(() => {
            latestBearerToken = "";
        });

        it("can login with valid credentials", (done) => {
            authenticator("referee@referee.org", "referee", ["referee"], done);
        });

        it("cannot create tournament data", (done) => {
            checkCreate("/tournament/tournaments", {}, 403, done);
        });

        it("cannot update tournament data", (done) => {
            checkUpdate("/tournament/tournaments", {}, 403, done);
        });

        it("cannot delete tournament data", (done) => {
            checkDelete("/tournament/tournaments", {}, 403, done);
        });

        it("cannot create results", (done) => {
            checkCreate("/tournament/results", newResult, 403, done);
        });

        it("can update results", (done) => {
            var result = {};
            request(app)
                .get("/tournament/results?conditions=%7B%22competition.name%22:%22U11%22,%22competition.section%22:%22A%22%7D")
                .end((err, res) => {
                    if (err) return done(err);
                    result = res.body[5];
                    result.homeGoals = 1;
                    result.awayGoals = 3;

                    request(app)
                        .put("/tournament/results/" + result.id)
                        .set("Authorization", "Bearer " + latestBearerToken)
                        .send(result)
                        .expect(200, done);
                });
        });

        it("cannot delete results", (done) => {
            checkDelete("/tournament/results", {}, 403, done);
        });

        it("cannot create news", (done) => {
            checkCreate("/tournament/news", {}, 403, done);
        });

        it("cannot update news", (done) => {
            checkUpdate("/tournament/news", {}, 403, done);
        });

        it("cannot delete news", (done) => {
            checkDelete("/tournament/news", {}, 403, done);
        });

        it("cannot confirm league positions", (done) => {
            checkCreate(
                "/tournament/leaguetables/U11/B/2",
                {
                    0: "Newcastle",
                    1: "Arsenal",
                    2: "Man. Utd.",
                    3: "Chelsea",
                    4: "Liverpool",
                },
                403,
                done
            );
        });
    });

    describe("an editor", () => {
        before(() => {
            latestBearerToken = "";
        });

        it("can login with valid credentials", (done) => {
            authenticator("editor@editor.org", "editor", ["editor", "referee"], done);
        });

        it("can create results", (done) => {
            request(app)
                .post("/tournament/results")
                .set("Authorization", "Bearer " + latestBearerToken)
                .send(newResult)
                .expect((res) => {
                    assert.equal(res.body.tag, newResult.tag);
                    assert.equal(res.body.pitch, newResult.pitch);
                    assert.equal(res.body.dateTime, newResult.dateTime);
                })
                .expect(201, done);
        });

        it("can confirm league table positions", (done) => {
            var table = { 0: "A", 1: "B", 2: "C", 3: "D", 4: "E" };
            request(app)
                .post("/tournament/leaguetables/U11/A/2")
                .set("Authorization", "Bearer " + latestBearerToken)
                .send(table)
                .expect(200)
                .end((err, res) => {
                    request(app)
                        .get(
                            "/tournament/results?conditions=%7B%22competition.name%22:%22U11%22,%22competition.section%22:%22A%22%7D"
                        )
                        .expect((res) => {
                            for (var i = 0; i < res.body.length; i++) {
                                var r = res.body[i];
                                if (r.homeTeamFrom == "U11_A_G2_P1") {
                                    assert.equal(r.homeTeam, table["0"]);
                                }
                                if (r.homeTeamFrom == "U11_A_G2_P2") {
                                    assert.equal(r.homeTeam, table["1"]);
                                }
                                if (r.homeTeamFrom == "U11_A_G2_P3") {
                                    assert.equal(r.homeTeam, table["2"]);
                                }
                                if (r.homeTeamFrom == "U11_A_G2_P4") {
                                    assert.equal(r.homeTeam, table["3"]);
                                }
                                if (r.homeTeamFrom == "U11_A_G2_P5") {
                                    assert.equal(r.homeTeam, table["4"]);
                                }
                            }
                        })
                        .expect(200, done);
                });
        });

        it("can create an announcement", (done) => {
            var newsItem = {
                title: "editor test",
                body: "this is an editor announcement",
            };
            request(app)
                .post("/tournament/news")
                .set("Authorization", "Bearer " + latestBearerToken)
                .send(newsItem)
                .expect(200)
                .end((err, res) => {
                    request(app)
                        .get("/tournament/news")
                        .expect((res) => {
                            var latestNews = res.body[res.body.length - 1];
                            assert.equal(latestNews.title, newsItem.title);
                            assert.equal(latestNews.body, newsItem.body);
                        })
                        .expect(200, done);
                });
        });

        it("cannot delete tournament data", (done) => {
            checkDelete("/tournament/tournaments", {}, 403, done);
        });
    });

    describe("an administrator", () => {
        var tourney = {
            name: "Test Tournament",
            competitions: [{ name: "comp1", section: "sect1", groups: 1 }],
        };

        before(() => {
            latestBearerToken = "";
        });

        it("can login with valid credentials", (done) => {
            authenticator("admin@admin.org", "admin", ["admin", "editor", "referee"], done);
        });

        it("can create tournament data", (done) => {
            checkCreate("/tournament/tournaments", tourney, 201, done);
        });

        it("cannot delete tournament data", (done) => {
            checkDelete("/tournament/tournaments", {}, 403, done);
        });

        it("can create an info page", (done) => {
            var page = {
                title: "page test",
                body: "page body",
            };
            request(app)
                .post("/tournament/pages")
                .set("Authorization", "Bearer " + latestBearerToken)
                .send(page)
                .expect(200)
                .end((err, res) => {
                    request(app)
                        .get("/tournament/pages")
                        .expect((res) => {
                            var latestPage = res.body[res.body.length - 1];
                            assert.equal(latestPage.title, page.title);
                            assert.equal(latestPage.body, page.body);
                        })
                        .expect(200, done);
                });
        });
    });
});
