/**
 * RequestsController
 *
 * @module :: Controller
 * @description :: Контроллер заявок на приложения.
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

module.exports = {

	registerView: function (req, res) {
		res.view('apps/register');
	},

	/* POST /apps/register */
	register: function (req, res) {
		if (!req.param('name') || !req.param('description') || !req.param('redirectURI') || !req.param('homeURI') || !req.param('message')) {
			return res.badRequest();
		}

		var newRequest = {
				id: parseInt(req.param('id'), 10),
				name: validator.escape(req.param('name')),
				description: validator.escape(req.param('description')),
				redirectURI: req.param('redirectURI'),
				homeURI: req.param('homeURI'),
				scope: [],
				message: validator.escape(req.param('message'))
			},
			httpValidatorOptions = {
				require_protocol: true
			};

		async.waterfall([
			function checkInput(callback) {
				if (!validator.isLength(newRequest.name, 1, 100)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'name'
					});
				}

				if (!validator.isLength(newRequest.description, 1, 100)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'description'
					});
				}

				if (!validator.isURL(newRequest.redirectURI, httpValidatorOptions)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'redirectURI'
					});
				}

				if (!validator.isURL(newRequest.homeURI, httpValidatorOptions)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'homeURI'
					});
				}

				if (req.param('profile') === 'on') {
					newRequest.scope.push('profile');
				}

				if (req.param('email') === 'on') {
					newRequest.scope.push('email');
				}

				if (req.param('regions') === 'on') {
					newRequest.scope.push('regions');
				}

				newRequest.scope = newRequest.scope.join(',');

				if (!newRequest.scope.length) {
					return res.json({
						message: 'ERROR',
						problemIn: 'scope'
					});
				}

				if (!newRequest.message) {
					return res.json({
						message: 'ERROR',
						problemIn: 'message'
					});
				}

				callback(null, newRequest);
			},
			function createRequest(newRequest, callback) {
				Requests.create({
					name: newRequest.name,
					description: newRequest.description,
					homeURI: newRequest.homeURI,
					redirectURI: newRequest.redirectURI,
					scope: newRequest.scope,
					message: newRequest.message,
					status: 0,
					owner: req.user.id,

				}).exec(function (err, request) {
					if (err) return callback(err);

					callback(null, request);
				});
			}
		], function (err) {
			if (err) return res.serverError(err);

			req.flash('info', 'Заявка на приложение успешно была отправлена.<br> О статусе рассмотрения вам обязательно напишет администрация.')

			res.json({
				message: 'OK'
			});
		});
	},

	/* GET /apps/requests/:id */
	get: function (req, res) {
		Requests.findOne(parseInt(req.param('id'), 10)).exec(function (err, result) {
			if (err) return res.serverError(err);

			res.json(result);
		});
	},

	/* POST /apps/requests/:id */
	edit: function (req, res) {
		if (!req.param('name') || !req.param('description') || !req.param('redirectURI') || !req.param('homeURI') || !req.param('message')) {
			return res.badRequest();
		}

		var newRequest = {
				id: parseInt(req.param('id'), 10),
				name: validator.escape(req.param('name')),
				description: validator.escape(req.param('description')),
				redirectURI: req.param('redirectURI'),
				homeURI: req.param('homeURI'),
				scope: [],
				message: validator.escape(req.param('message'))
			},
			httpValidatorOptions = {
				require_protocol: true
			};

		async.waterfall([
			function checkInput(callback) {
				if (!validator.isLength(newRequest.name, 1, 100)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'name'
					});
				}

				if (!validator.isLength(newRequest.description, 1, 100)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'description'
					});
				}

				if (!validator.isURL(newRequest.redirectURI, httpValidatorOptions)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'redirectURI'
					});
				}

				if (!validator.isURL(newRequest.homeURI, httpValidatorOptions)) {
					return res.json({
						message: 'ERROR',
						problemIn: 'homeURI'
					});
				}

				if (req.param('profile') === 'on') {
					newRequest.scope.push('profile');
				}

				if (req.param('email') === 'on') {
					newRequest.scope.push('email');
				}

				if (req.param('regions') === 'on') {
					newRequest.scope.push('regions');
				}

				newRequest.scope = newRequest.scope.join(',');

				if (!newRequest.scope.length) {
					return res.json({
						message: 'ERROR',
						problemIn: 'scope'
					});
				}

				callback(null, newRequest);
			},
			function setRequest(newRequest, callback) {
				Requests.findOne(newRequest.id).exec(function (err, request) {
					if (err) return callback(err);

					request.name = newRequest.name;
					request.description = newRequest.description;
					request.homeURI = newRequest.homeURI;
					request.redirectURI = newRequest.redirectURI;
					request.redirectURI = newRequest.redirectURI;
					request.scope = newRequest.scope;
					request.message = newRequest.message;

					request.save(function (err, request) {
						if (err) return callback(err);

						callback(null, request);
					});
				});
			}
		], function (err, request) {
			if (err) return res.serverError(err);

			req.flash('info', 'Заявка на приложение &laquo;' + request.name + '&raquo; успешно отредактирована');

			res.json({
				message: 'OK'
			});
		});
	},

	/* POST /apps/requests/:id/status */
	changeStatus: function (req, res) {
		if (!req.param('status')) {
			return res.badRequest();
		}

		var requestId = parseInt(req.param('id'), 10),
			status = parseInt(req.param('status'), 10);

		async.waterfall([
			function changeStatus(callback) {
				Requests.findOne(requestId).exec(function (err, request) {
					if (err) return callback(err);

					if (request.status === status) {
						return res.json({
							message: 'OK'
						});
					}

					request.status = status;

					request.save(function (err, request) {
						if (err) return callback(err);

						callback(null, request);
					});
				});
			},
			function registerApp(request, callback) {
				if (request.status === 1) {
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
						'"0");';

					gcdb.apidb.query(query, function (err, result) {
						if (err) return callback(err);

						callback(null, request);
					});
				} else {
					callback(null, request);
				}
			}
		], function (err, request) {
			if (err) return res.serverError(err);

			var message;

			if (request.status === 1) {
				message = 'Приложение &laquo;' + request.name + '&raquo; успешно зарегистрировано.<br><h3>Данные:</h3><pre><code class="nohighlight">' +
					'Название: &laquo;' + request.name + '&raquo;\n' +
					'Краткое описание: &laquo;' + request.description + '&raquo;\n' +
					'Домашняя страница: &laquo;' + request.homeURI + '&raquo;\n' +
					'Callback: &laquo;' + request.redirectURI + '&raquo;\n' +
					'Права: &laquo;' + request.scope + '&raquo;\n' +
					'Секретный ключ: &laquo;' + request.clientSecret + '&raquo;\n' +
					'</code></pre>';
			} else {
				message = 'Статус заявки на приложение &laquo;' + request.name + '&raquo; сменён на &laquo;Отклонён&raquo;.';
			}

			req.flash('info', message);

			res.json({
				message: 'OK'
			});
		});
	}
};
