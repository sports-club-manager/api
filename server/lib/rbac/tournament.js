const logger = require("log4js").getLogger();

const ROLE_EDITOR = "tournament_editor";
const ROLE_REFEREE = "tournament_referee";
const ROLE_ADMIN = "tournament_admin";

module.exports = (acl, apiRoot, roleGuest) => {
    if (acl && apiRoot && roleGuest) {
        acl.allow(
            [
                {
                    roles: [ROLE_ADMIN],
                    allows: [
                        {
                            resources: [`${apiRoot}/tournaments`, `${apiRoot}/news`, `${apiRoot}/results`, `${apiRoot}/pages`],
                            permissions: ["*"],
                        },
                    ],
                },
                {
                    roles: [ROLE_EDITOR],
                    allows: [
                        { resources: [`${apiRoot}/results`], permissions: ["post", "put", "delete"] },
                        { resources: [`${apiRoot}/news`], permissions: ["post", "put"] },
                        { resources: [`${apiRoot}/leaguetables`], permissions: ["post"] },
                    ],
                },
                {
                    roles: [ROLE_REFEREE],
                    allows: [{ resources: [`${apiRoot}/results`], permissions: ["put"] }],
                },
                {
                    roles: [roleGuest],
                    allows: [
                        {
                            resources: [`${apiRoot}/results`, `${apiRoot}/news`, `${apiRoot}/tournaments`, `${apiRoot}/pages`],
                            permissions: ["get"],
                        },
                    ],
                },
            ],
            function (err) {
                if (err) {
                    logger.error(`Unable to setup permissions and roles for ${apiRoot}`);
                    logger.error(err);
                }
            }
        );

        // roles and anonymous user
        acl.addRoleParents(ROLE_REFEREE, [roleGuest]);
        acl.addRoleParents(ROLE_EDITOR, [ROLE_REFEREE]);
        acl.addRoleParents(ROLE_ADMIN, [ROLE_EDITOR]);
    }

    return {
        ROLE_REFEREE: ROLE_REFEREE,
        ROLE_EDITOR: ROLE_EDITOR,
        ROLE_ADMIN: ROLE_ADMIN,
    };
};
