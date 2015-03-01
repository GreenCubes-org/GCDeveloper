/**
 * Session Configuration
 * (sails.config.session)
 *
 * Sails session integration leans heavily on the great work already done by
 * Express, but also unifies Socket.io with the Connect session store. It uses
 * Connect's cookie parser to normalize configuration differences between Express
 * and Socket.io and hooks into Sails' middleware interpreter to allow you to access
 * and auto-save to `req.session` with Socket.io the same way you would with Express.
 *
 * For more information on configuring the session, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.session.html
 */

var appConfig = require('./local.js');

/* 730 days ~= 1 month */
var sessionTTLInSeconds = 730 * 60 * 60 * 1000;

module.exports.session = {

	secret: appConfig.sessionSecret || '7ab616693860ea5bc0d489c5999ac80b',

	cookie: {
		maxAge: sessionTTLInSeconds
	},

	adapter: 'redis',
	host: appConfig.db.redis.host,
	port: appConfig.db.redis.port,
	ttl: sessionTTLInSeconds,
	db: appConfig.db.redis.db.session,
	pass: appConfig.db.redis.pass,
	prefix: 'sess:'

};
