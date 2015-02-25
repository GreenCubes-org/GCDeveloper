var passport = require('passport');
var OAuth2Strategy = require('passport-oauth2').Strategy;
var mysql = require('mysql');
var crypto = require('crypto');

var expressValidator = require('express-validator');
var flash = require('connect-flash');

var appConfig = require('./local.js');

passport.serializeUser(function (user, done) {
	done(null, user.gameId);
});

passport.deserializeUser(function (id, done) {
	var user = {
		gameId: id
	};

	async.waterfall([
		function getUserCredentials(callback) {
			gcdb.sitedb.query('SELECT id, login FROM users WHERE game_id = ?', [user.gameId], function (err, result) {
				if (err) return callback(err);

				user.id = result[0].id;
				user.username = result[0].login;

				callback(null, user);
			});
		},
		function getGameId(user, callback) {
			gcdb.user.getByLogin(user.username, 'maindb', function (err, result) {
				if (err) return callback(err);

				user.gameId = result;

				callback(null, user);
			});
		},
		function getUserRights(user, callback) {
			gcdb.appdb.query('SELECT * FROM users WHERE uid = ?', [user.id], function (err, result) {
				if (err) return callback(err);

				if (result.length !== 0) {
					if (result[0].staff) {
						user.staff = true;
					} else {
						user.staff = false;
					}
				} else {
					user.staff = false;
				}

				callback(null, user);
			});
		}
	],
	function (err, user) {
		if (err) return done(err);

		done(null, user);
	});
})

module.exports = {

	// Init custom express middleware
	express: {
		customMiddleware: function (app) {
			passport.use(new OAuth2Strategy({
				authorizationURL: appConfig.oauth2.authorizationURL,
				tokenURL: appConfig.oauth2.tokenURL,
				clientID: appConfig.oauth2.clientID,
				clientSecret: appConfig.oauth2.clientSecret,
				callbackURL: appConfig.oauth2.callbackURL
			}, function (accessToken, refreshToken, profile, done) {
				Users.findOrCreate({
					gameId: accessToken.userId
				}, function (err, user) {
					if (!user.uid) {
						if (err) return done(err);

						user.gameId = accessToken.userId;

						user.staff = false;

						gcdb.sitedb.query('SELECT id, login FROM users WHERE game_id = ?', [user.gameId], function (err, result) {
							if (err) return done(err);

							user.uid = result[0].id;

							user.save(function (err, user) {
								return done(err, user);
							});
						});
					} else {
						return done(err, user);
					}
				});
			}));

			app.use(passport.initialize());
			app.use(passport.session());

			app.use(expressValidator());

			app.use(flash());
		}
	}
};
