/**
 * Passport configuration
 *
 * This is the configuration for your Passport.js setup and where you
 * define the authentication strategies you want your application to employ.
 *
 * I have tested the service with all of the providers listed below - if you
 * come across a provider that for some reason doesn't work, feel free to open
 * an issue on GitHub.
 *
 * Also, authentication scopes can be set through the `scope` property.
 *
 * For more information on the available providers, check out:
 * http://passportjs.org/guide/providers/
 */

var sails = require('sails'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    express = require('express');

//passport.use(LocalStrategy);

/*
 passport.use(new LocalStrategy({
 usernameField: 'email'
 },
 function (email, password, done) {
 User.findByEmail(email).exec(function (err, user) {
 if (err) {
 return done(null, err);
 }
 if (!user || user.length < 1) {
 return done(null, false, { message: 'Incorrect User'});
 }
 bcrypt.compare(password, user[0].password, function (err, res) {
 if (!res) return done(null, false, { message: 'Invalid Password'});
 return done(null, user);
 });
 });
 })
 );
 */

module.exports.passport = {
    local: {
        strategy: require('passport-local').Strategy
    }
};
