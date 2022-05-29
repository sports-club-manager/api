const GoogleStrategy = require("passport-google-oauth20").Strategy;
const { User } = require("../db/auth");
const { acl, ROLE_GUEST } = require("./rbac");
const logger = require("log4js").getLogger();
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.NODE_ENV == "prod" ? require("crypto").randomBytes(64).toString("base64").slice(0, 64) : "s3cr3t!";
const jwtExpiresAfter = (process.env.AUTH_JWT_EXPIRES_IN_MINUTES || 30) * 60;

const buildTokenFor = (user) => {
    return jwt.sign(
        {
            sub: user._id,
            email: user.email,
            name: user.displayName,
            picture: user.photo,
            roles: user.roles,
        },
        jwtSecret,
        { expiresIn: jwtExpiresAfter }
    );
};

const findOrCreateUser = (profile, cb) => {
    logger.debug("Profile returned from google", profile);

    User.findOne({ providerId: profile.id, providerName: profile.provider }, (err, user) => {
        logger.debug(`User lookup returned ${user}`);

        if (user === null) {
            logger.debug("Creating new user");
            User.create(
                {
                    providerId: profile.id,
                    providerName: profile.provider,
                    email: profile.emails[0].value,
                    photo: profile.photos[0].value,
                    displayName: profile.displayName,
                    roles: [ROLE_GUEST],
                },
                (err, user) => {
                    if (err) {
                        logger.error("Failed to create user", err);
                        return null;
                    } else {
                        addRolesToAclUser(user, cb);
                    }
                }
            );
        } else {
            addRolesToAclUser(user, cb);
        }
    });
};

// Only want the userId for ACL comparisons
const getUserId = (req) => {
    let id = "anonymous";
    let authHeader = req.headers.authorization;

    logger.debug(`auth header: ${authHeader}`);
    if (authHeader && authHeader.startsWith("Bearer ")) {
        let token = authHeader.split(" ")[1];
        try {
            let decoded = jwt.verify(token, jwtSecret);
            logger.debug(`token decoded as: ${JSON.stringify(decoded)}`);
            id = decoded.sub;
        } catch (err) {
            logger.warn("User token is invalid or expired");
        }
    }

    logger.debug(`returning user ${id} from getUserId function`);
    return id;
};

// take roles from user profile and update ACL backend
const addRolesToAclUser = (user, cb) => {
    user.roles.forEach((role) => {
        acl.addUserRoles(user._id.toString(), role, (err) => {
            if (err) {
                logger.error(err);
            } else {
                logger.debug(`added '${role}' role to user ${user._id}`);
            }
        });
    });
    cb(null, user);
};

const init = (passport, authMount) => {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.AUTH_GOOGLE_CLIENT_ID,
                clientSecret: process.env.AUTH_GOOGLE_CLIENT_SECRET,
                callbackURL: `/${authMount}/login/google/callback`,
            },
            (accessToken, refreshToken, profile, cb) => {
                findOrCreateUser(profile, cb);
            }
        )
    );

    passport.serializeUser((user, cb) => {
        logger.debug("Serializing user", user);
        cb(null, user._id);
    });

    passport.deserializeUser((userId, cb) => {
        logger.debug("Deserializing user with id", userId);
        User.findById(userId, (err, user) => {
            cb(null, user);
        });
    });
};

module.exports = {
    init: init,
    getUserId: getUserId,
    buildTokenFor: buildTokenFor,
    addRolesToAclUser: addRolesToAclUser,
};
