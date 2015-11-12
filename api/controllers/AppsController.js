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
		if (!req.param('name') || !req.param('description') || !req.param('redirectURI') || !req.param('homeURI')) {
			return res.badRequest();
		}

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

				if (!newApp.scope.length) {
					return res.json({
						message: 'ERROR',
						problemIn: 'scope'
					});
				}

				callback(null, newApp);
			},
			function writeNewApp(newApp, callback) {
				var query = 'UPDATE `client` SET ' +
					'`name` = ' + gcdb.escape(newApp.name) + ',' +
					'`description` = ' + gcdb.escape(newApp.description) + ',' +
					'`redirectURI` = ' + gcdb.escape(newApp.redirectURI) + ',' +
					'`homeURI` = ' + gcdb.escape(newApp.homeURI) + ',' +
					((typeof newApp.internal === 'number') ? '`internal` = ' +  newApp.internal + ',' : '') +
					'`scope` = "' + newApp.scope + '"' +
					'WHERE `id` = ' + newApp.id;

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
		if (!req.param('newOwner')) {
			return res.badRequest();
		}

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
	},

	/* GET /apps/new */
	newView: function (req, res) {
		res.view('apps/new');
	},

	/* POST /apps/new */
	new: function (req, res) {
		if (!req.param('name') || !req.param('description') || !req.param('redirectURI') || !req.param('homeURI') || !req.param('owner') || !req.param('internal')) {
			return res.badRequest();
		}

		var request = {
				id: parseInt(req.param('id'), 10),
				name: validator.escape(req.param('name')),
				description: validator.escape(req.param('description')),
				redirectURI: req.param('redirectURI'),
				homeURI: req.param('homeURI'),
				scope: [],
				internal: (req.param('internal') === 'true') ? 1 : 0,
				owner: req.param('owner').replace(/[^a-zA-Z0-9_-]/g, '')
			},
			httpValidatorOptions = {
				require_protocol: true
			};

		async.waterfall([
			function checkInput(callback) {
				if (!validator.isLength(request.name, 1, 100)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'name'
					});
				}

				if (!validator.isLength(request.description, 1, 100)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'description'
					});
				}

				if (!validator.isURL(request.redirectURI, httpValidatorOptions)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'redirectURI'
					});
				}

				if (!validator.isURL(request.homeURI, httpValidatorOptions)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'homeURI'
					});
				}

				if (req.body.all === 'on') {
					request.scope = '*';
				} else {
					if (req.param('profile') === 'on') {
						request.scope.push('profile');
					}

					if (req.param('email') === 'on') {
						request.scope.push('email');
					}

					if (req.param('regions') === 'on') {
						request.scope.push('regions');
					}

					request.scope = request.scope.join(',');

					if (!request.scope.length) {
						return res.json({
							message: 'ERROR',
							problemIn: 'scope'
						});
					}
				}

				callback(null, request);
			},
			function getOwner(request, callback) {
				gcdb.user.getByLogin(request.owner, 'sitedb', function (err, uid) {
					if (err) return callback(err);

					request.owner = uid;

					callback(null, request);
				});
			},
			function registerApp(request, callback) {
				request.clientSecret = generateUID(64);

				var query = 'INSERT INTO `client` (`name`, `clientSecret`, `redirectURI`, `scope`, `homeURI`, `owner`, `description`, `createdAt`, `updatedAt`, `internal`)' +
					'VALUES (' +
					gcdb.escape(request.name) + ',' +
					'"' + request.clientSecret + '",' +
					gcdb.escape(request.redirectURI) + ',' +
					'"' + request.scope + '",' +
					gcdb.escape(request.homeURI) + ',' +
					'"' + request.owner + '",' +
					gcdb.escape(request.description) + ',' +
					'NOW(),' +
					'NOW(),' +
					'"' + request.internal + '");';

				gcdb.apidb.query(query, function (err, result) {
					if (err) return callback(err);

					callback(null, request);
				});
			}
		], function (err, request) {
			if (err) return res.serverError(err);

			var message;

			message = 'Приложение &laquo;' + request.name + '&raquo; успешно зарегистрировано.<br><h3>Данные:</h3><pre><code class="nohighlight">' +
				'Название: &laquo;' + request.name + '&raquo;\n' +
				'Краткое описание: &laquo;' + request.description + '&raquo;\n' +
				'Домашняя страница: &laquo;' + request.homeURI + '&raquo;\n' +
				'Callback: &laquo;' + request.redirectURI + '&raquo;\n' +
				'Права: &laquo;' + request.scope + '&raquo;\n' +
				'Секретный ключ: &laquo;' + request.clientSecret + '&raquo;\n' +
				((request.internal) ? 'Приложение служебное.' : '') +
				'</code></pre>';

			req.flash('info', message);

			res.json({
				message: 'OK'
			});
		});
	}

};
