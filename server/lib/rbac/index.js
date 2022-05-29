const ACL = require("acl2");
const logger = require("log4js").getLogger();

const USER_ANONYMOUS = "anonymous";
const ROLE_GUEST = "guest";

const acl = new ACL(new ACL.memoryBackend());

// roles and anonymous user
acl.addUserRoles(USER_ANONYMOUS, ROLE_GUEST);

// api acl's
require("./tournament")(acl, "/tournament", ROLE_GUEST);

module.exports = {
    acl: acl,
    ROLE_GUEST: ROLE_GUEST,
};
