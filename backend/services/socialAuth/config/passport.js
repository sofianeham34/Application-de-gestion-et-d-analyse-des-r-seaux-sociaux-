const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;
const InstagramStrategy = require("passport-instagram").Strategy;

const callbackUrl = (network) => `${process.env.PROXY_GATEWAY}/api/socialauth/connect/${network}/callback`;

// Réseaux dont les clés API sont configurées. Un réseau sans clé est
// simplement désactivé, au lieu d'empêcher le service de démarrer.
const enabled = {
    facebook: Boolean(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
    instagram: Boolean(process.env.INSTAGRAM_CLIENT_ID && process.env.INSTAGRAM_CLIENT_SECRET),
    twitter: Boolean(process.env.TWITTER_KEY && process.env.TWITTER_SECRET),
};

if (enabled.facebook) {
    passport.use(new FacebookStrategy(
        {
            clientID: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
            callbackURL: callbackUrl("facebook"),
            passReqToCallback: true,
            profileFields: ["id", "displayName", "email", "photos"]
        },
        (req, accessToken, refreshToken, profile, done) => done(null, { profile, accessToken })
    ));
}

if (enabled.instagram) {
    passport.use(new InstagramStrategy(
        {
            clientID: process.env.INSTAGRAM_CLIENT_ID,
            clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
            callbackURL: callbackUrl("instagram"),
            passReqToCallback: true,
            scope: ["instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments,instagram_business_content_publish,instagram_business_manage_insights"]
        },
        (req, accessToken, refreshToken, profile, done) => done(null, { profile, accessToken })
    ));
}

if (enabled.twitter) {
    passport.use(new TwitterStrategy(
        {
            consumerKey: process.env.TWITTER_KEY,
            consumerSecret: process.env.TWITTER_SECRET,
            callbackURL: callbackUrl("twitter")
        },
        (token, tokenSecret, profile, done) => done(null, { token, tokenSecret, profile })
    ));
}

module.exports = { enabled };
