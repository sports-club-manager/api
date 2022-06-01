require("dotenv").config();
const assert = require("assert");
const { acl, ROLE_GUEST } = require("../server/lib/rbac");
const { ROLE_REFEREE, ROLE_EDITOR, ROLE_ADMIN } = require("../server/lib/rbac/tournament")();
const logger = require("log4js").getLogger("test");
logger.level = process.env.API_LOGGER_LEVEL || "warn";

describe("When using the Tournament API RBAC model", () => {
    const userId = "testuser";
    const roles = [ROLE_GUEST, ROLE_REFEREE, ROLE_EDITOR, ROLE_ADMIN];

    const rbacCheck = (user, resource, action, expectedResult) => {
        resource = `/tournament${resource}`;
        acl.isAllowed(user, resource, action, (err, actualResult) => {
            if (err) logger.error(err);
            let result = `${user} can ${action} ${resource} should be ${expectedResult}. Result is ${actualResult}`;
            if (expectedResult !== actualResult) {
                logger.fatal(result);
            } else {
                logger.debug(result);
            }
            assert.strictEqual(expectedResult, actualResult);
        });
    };

    beforeEach(() => {
        acl.removeUserRoles(userId, roles, (err) => {
            if (err) logger.error(err);
        });
    });

    it("Should allow viewing of public content by guest", (done) => {
        acl.addUserRoles(userId, ROLE_GUEST, (err) => {
            rbacCheck(userId, "/tournaments", "get", true);
            rbacCheck(userId, "/results", "get", true);
            rbacCheck(userId, "/news", "get", true);
            rbacCheck(userId, "/pages", "get", true);
            done();
        });
    });

    it("Should deny non-public content to guest", (done) => {
        acl.addUserRoles(userId, ROLE_GUEST, (err) => {
            rbacCheck(userId, "/tournaments", "post", false);
            rbacCheck(userId, "/results", "post", false);
            rbacCheck(userId, "/news", "post", false);
            rbacCheck(userId, "/pages", "post", false);
            rbacCheck(userId, "/tournaments", "put", false);
            rbacCheck(userId, "/results", "put", false);
            rbacCheck(userId, "/news", "put", false);
            rbacCheck(userId, "/pages", "put", false);
            rbacCheck(userId, "/tournaments", "patch", false);
            rbacCheck(userId, "/results", "patch", false);
            rbacCheck(userId, "/news", "patch", false);
            rbacCheck(userId, "/pages", "patch", false);
            rbacCheck(userId, "/tournaments", "delete", false);
            rbacCheck(userId, "/results", "delete", false);
            rbacCheck(userId, "/news", "delete", false);
            rbacCheck(userId, "/pages", "delete", false);
            rbacCheck(userId, "/leaguetables", "post", false);
            done();
        });
    });

    it("Should allow viewing of public content by referee", (done) => {
        acl.addUserRoles(userId, ROLE_REFEREE, (err) => {
            rbacCheck(userId, "/tournaments", "get", true);
            rbacCheck(userId, "/results", "get", true);
            rbacCheck(userId, "/news", "get", true);
            rbacCheck(userId, "/pages", "get", true);
            done();
        });
    });

    it("Should allow editing of results by referee", (done) => {
        acl.addUserRoles(userId, ROLE_REFEREE, (err) => {
            rbacCheck(userId, "/results", "put", true);
            done();
        });
    });

    it("Should deny editor/admin funtions to referee", (done) => {
        acl.addUserRoles(userId, ROLE_REFEREE, (err) => {
            rbacCheck(userId, "/tournaments", "post", false);
            rbacCheck(userId, "/results", "post", false);
            rbacCheck(userId, "/news", "post", false);
            rbacCheck(userId, "/pages", "post", false);
            rbacCheck(userId, "/tournaments", "put", false);
            rbacCheck(userId, "/news", "put", false);
            rbacCheck(userId, "/pages", "put", false);
            rbacCheck(userId, "/tournaments", "patch", false);
            rbacCheck(userId, "/results", "patch", false);
            rbacCheck(userId, "/news", "patch", false);
            rbacCheck(userId, "/pages", "patch", false);
            rbacCheck(userId, "/tournaments", "delete", false);
            rbacCheck(userId, "/results", "delete", false);
            rbacCheck(userId, "/news", "delete", false);
            rbacCheck(userId, "/pages", "delete", false);
            rbacCheck(userId, "/leaguetables", "post", false);
            done();
        });
    });

    it("Should allow viewing of public content by editor", (done) => {
        acl.addUserRoles(userId, ROLE_EDITOR, (err) => {
            rbacCheck(userId, "/tournaments", "get", true);
            rbacCheck(userId, "/results", "get", true);
            rbacCheck(userId, "/news", "get", true);
            rbacCheck(userId, "/pages", "get", true);
            done();
        });
    });

    it("Should allow create/edit of results and editor content by editor", (done) => {
        acl.addUserRoles(userId, ROLE_EDITOR, (err) => {
            rbacCheck(userId, "/results", "post", true);
            rbacCheck(userId, "/results", "delete", true);
            rbacCheck(userId, "/news", "put", true);
            rbacCheck(userId, "/news", "post", true);
            rbacCheck(userId, "/leaguetables", "post", true);
            done();
        });
    });

    it("Should deny admin funtions to editor", (done) => {
        acl.addUserRoles(userId, ROLE_EDITOR, (err) => {
            rbacCheck(userId, "/tournaments", "post", false);
            rbacCheck(userId, "/tournaments", "put", false);
            rbacCheck(userId, "/tournaments", "patch", false);
            rbacCheck(userId, "/tournaments", "delete", false);
            rbacCheck(userId, "/news", "delete", false);
            rbacCheck(userId, "/pages", "put", false);
            rbacCheck(userId, "/pages", "post", false);
            rbacCheck(userId, "/pages", "delete", false);
            done();
        });
    });

    it("Should allow viewing of public content by admin", (done) => {
        acl.addUserRoles(userId, ROLE_ADMIN, (err) => {
            rbacCheck(userId, "/tournaments", "get", true);
            rbacCheck(userId, "/results", "get", true);
            rbacCheck(userId, "/news", "get", true);
            rbacCheck(userId, "/pages", "get", true);
            done();
        });
    });

    it("Should allow editing of results and tournament by admin", (done) => {
        acl.addUserRoles(userId, ROLE_ADMIN, (err) => {
            rbacCheck(userId, "/results", "post", true);
            rbacCheck(userId, "/tournaments", "post", true);
            rbacCheck(userId, "/tournaments", "put", true);
            rbacCheck(userId, "/tournaments", "patch", true);
            // the RBAC allows the next one, but the API removes the method so will 
            // result in 405 status if called
            rbacCheck(userId, "/tournaments", "delete", true);
            rbacCheck(userId, "/results", "delete", true);
            rbacCheck(userId, "/news", "delete", true);
            rbacCheck(userId, "/pages", "put", true);
            rbacCheck(userId, "/pages", "post", true);
            rbacCheck(userId, "/pages", "delete", true);
            done();
        });
    });
});
