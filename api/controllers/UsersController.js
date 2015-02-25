/**
 * UsersController
 *
 * @module :: Controller
 * @description :: Контроллер пользователей.
 */

var passport = require('passport'),
	moment = require('moment');

module.exports = {

	login: function (req, res) {
		res.redirect(appConfig.oauth2.loginURL);
	},

	logout: function (req, res) {
		req.logout();
		// TODO: Сделать flash-сообщение о том, что всё прошло успешно
		res.redirect('/');
	},

	callback: function (req, res) {
		passport.authenticate('oauth2', function (err, user, info) {
			if (!user) {
				return res.json({
					error: info
				});
			}
			req.logIn(user, function (err) {
				if (err) {
					throw err;
				}
				res.redirect('/');
			});
		})(req, res);
	}
};
