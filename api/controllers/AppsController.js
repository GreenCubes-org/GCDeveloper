/**
 * AppsController
 *
 * @module :: Controller
 * @description :: Контроллер приложений.
 */

var net = require('net');
var validator = require('validator');

/**
 * Return a unique identifier with the given `len`.
 *
 *     gct.generateUID(10);
 *     // => "FDaS435D2z"
 *
 * @param {Number} len
 * @return {String}
 * @api private
 */

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var generateUID = function(len) {
  var buf = []
    , chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789./'
    , charlen = chars.length;

  for (var i = 0; i < len; ++i) {
    buf.push(chars[getRandomInt(0, charlen - 1)]);
  }

  return buf.join('');
};

function serializeRequestStatus(id) {
	switch (id) {
		case 0:
			return {
				id: 0,
				class: 'blue',
				name: 'На рассмотрении'
			};

		case 1:
			return {
				id: 1,
				class: 'green',
				name: 'Принят'
			};

		case 2:
			return {
				id: 2,
				class: 'red',
				name: 'Отклонён'
			};

		default:
			return {
				id: -1,
				class: '',
				name: ''
			};
	}
};

module.exports = {

	/* GET /apps */
	list: function (req, res) {
		var apps = [],
			requests = [];

		async.waterfall([
			function getApps(callback) {
				gcdb.api.apps.list(req.user.id, req.user.staff, function (err, result) {
					if (err) return callback(err);

					callback(null, result);
				});
			},
			function serializeApps(apps, callback) {
				async.map(apps, function (element, callback) {
					gcdb.user.getByID(element.owner, function (err, login) {
						if (err) return callback(err);

						element.owner = login;

						callback(null, element);
					});
				}, function (err, apps) {
					if (err) return callback(err);

					callback(null, apps);
				});
			},
			function getRequests(apps, callback) {
				if (req.user.staff) {
					Requests.find().sort('id DESC').exec(function (err, result) {
						if (err) return callback(err);

						callback(null, apps, result);
					});
				} else {
					callback(null, apps, []);
				}
			},
			function serializeRequests(apps, requests, callback) {
				async.map(requests, function (element, callback) {
					gcdb.user.getByID(element.owner, function (err, login) {
						if (err) return callback(err);

						element.owner = login;

						element.status = serializeRequestStatus(element.status);

						callback(null, element);
					});
				}, function (err, requests) {
					if (err) return callback(err);

					callback(null, apps, requests);
				});
			}
		], function (err, apps, requests) {
			if (err) return res.serverError(err);

			res.view('apps/list', {
				apps: apps,
				requests: requests
			});
		});
	},

	/* GET /apps/:id */
	get: function (req, res) {
		var id = parseInt(req.param('id'), 10),
			app = {};

		async.waterfall([
			function getApp(callback) {
				gcdb.api.apps.get(id, function (err, result) {
					if (err) return callback(err);

					app = result;

					delete app.clientSecret;

					callback(null, app);
				});
			},
			function checkRights(app, callback) {
				if (req.user.staff || app.owner === req.user.id) {
					callback(null, app);
				} else {
					res.forbidden();
				}
			},
			function serializeApp(app, callback) {
				gcdb.user.getByID(app.owner, function (err, login) {
					if (err) return callback(err);

					app.owner = login;

					app.internal = (app.internal) ? true : false;

					callback(null, app);
				});
			}
		], function (err, app) {
			if (err) return res.serverError(err);

			res.json(app);
		});
	},

	/* POST /apps/:id */
	edit: function (req, res) {
		var newApp = {
				id: parseInt(req.param('id'), 10),
				name: validator.escape(req.param('name')),
				description: validator.escape(req.param('description')),
				redirectURI: req.param('redirectURI'),
				homeURI: req.param('homeURI'),
				internal: (req.param('internal') === 'true') ? 1 : 0,
				scope: []
			},
			httpValidatorOptions = {
				require_protocol: true
			};

		async.waterfall([
			function checkInput(callback) {
				if (!validator.isLength(newApp.name, 1, 100)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'name'
					});
				}

				if (!validator.isLength(newApp.description, 1, 100)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'description'
					});
				}

				if (!validator.isURL(newApp.redirectURI, httpValidatorOptions)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'redirectURI'
					});
				}

				if (!validator.isURL(newApp.homeURI, httpValidatorOptions)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'homeURI'
					});
				}

				if (!req.user.staff) {
					delete newApp.internal;
				}

				if (req.param('profile') === 'on') {
					newApp.scope.push('profile');
				}

				if (req.param('email') === 'on') {
					newApp.scope.push('email');
				}

				if (req.param('regions') === 'on') {
					newApp.scope.push('regions');
				}

				newApp.scope = newApp.scope.join(',');

				if (!newRequest.scope.length) {
					return res.json({
						message: 'ERROR',
						problemIn: 'scope'
					});
				}

				callback(null, newApp);
			},
			function writeNewApp(newApp, callback) {
				var query = 'UPDATE `client` SET ' +
					'`name` = "' + newApp.name + '",' +
					'`description` = "' + newApp.description + '",' +
					'`redirectURI` = "' + newApp.redirectURI + '",' +
					'`homeURI` = "' + newApp.homeURI + '",' +
					((typeof newApp.internal !== 'number') ? '`internal` = ' +  newApp.internal + ',' : '') +
					'`scope` = "' + newApp.scope + '"' +
					'WHERE `id` = ' + newApp.id;

				console.log(query);

				gcdb.apidb.query(query, function (err, result) {
					if (err) return callback(err);

					callback(null, newApp);
				});
			}
		], function (err, newApp) {
			if (err) return res.serverError(err);

			req.flash('info', 'Приложение &laquo;' + newApp.name + '&raquo; успешно отредактировано');

			res.json({
				message: 'OK'
			});
		});
	},

	/* POST /apps/:id/regeneratekey */
	regenerateKey: function (req, res) {
		var client = {
			id: parseInt(req.param('id'), 10),
			newCode: generateUID(64)
		};

		async.waterfall([
			function replaceClientSecret(callback) {
				gcdb.apidb.query('UPDATE `client` SET `clientSecret` = "' + client.newCode + '" WHERE `id` = ' + client.id, function (err, result) {
					if (err) return callback(err);

					callback(null);
				});
			}
		], function (err) {
			if (err) return res.serverError(err);

			res.json({
				message: 'OK',
				newCode: client.newCode
			});
		});
	},

	/* POST /apps/:id/changeowner */
	changeOwner: function (req, res) {
		var newOwner = {
				id:	null,
				login: req.param('newOwner').replace(/[^a-zA-Z0-9_-]/g, '')
			},
			clientId = parseInt(req.param('id'), 10);

		async.waterfall([
			function checkInput(callback) {
				if (req.param('newOwner') !== newOwner.login) {
					return res.json({
						message: 'ERROR',
						error: 'Правильно введите никнейм'
					});
				}

				callback(null, newOwner);
			},
			function getUID(newOwner, callback) {
				gcdb.sitedb.query('SELECT id, login FROM `users` WHERE `login` = ?', [newOwner.login], function (err, result) {
					if (err) return callback(err);

					newOwner.id = result[0].id;
					newOwner.login = result[0].login;

					callback(null, newOwner);
				});
			},
			function replaceOwner(newOwner, callback) {
				gcdb.apidb.query('UPDATE `client` SET `owner` = "' + newOwner.id + '" WHERE `id` = ' + clientId, function (err, result) {
					if (err) return callback(err);

					callback(null, newOwner);
				});
			}
		], function (err, newOwner) {
			if (err) return res.serverError(err);

			res.json({
				message: 'OK',
				newOwner: newOwner.login
			});
		});
	},

	/* DELETE /apps/:id */
	delete: function (req, res) {
		var client = {
			id: parseInt(req.param('id'), 10),
			name: ""
		};

		async.waterfall([
			function saveName(callback) {
				gcdb.apidb.query('SELECT * FROM `client` WHERE `id` = ?', [client.id], function (err, result) {
					if (err) return callback(err);

					client.name = result[0].name;

					callback(null);
				});
			},
			function deleteClient(callback) {
				gcdb.apidb.query('DELETE FROM `client` WHERE `id` = ?', [client.id], function (err, result) {
					if (err) return callback(err);

					callback(null);
				});
			},
			function deleteAuthCodes(callback) {
				gcdb.apidb.query('DELETE FROM `authcode` WHERE `id` = ?', [client.id], function (err, result) {
					if (err) return callback(err);

					callback(null);
				});
			},
			function deleteTokens(callback) {
				gcdb.apidb.query('DELETE FROM `token` WHERE `id` = ?', [client.id], function (err, result) {
					if (err) return callback(err);

					callback(null);
				});
			}
		], function (err) {
			if (err) return res.serverError(err);

			req.flash('info', 'Приложение &laquo;' + client.name + '&raquo; успешно удалено');

			res.json({
				message: 'OK'
			});
		});
	}

};
