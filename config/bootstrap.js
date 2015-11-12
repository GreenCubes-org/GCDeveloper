/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs before your Sails app gets lifted.
 * This gives you an opportunity to set up your data model, run jobs, or perform some special logic.
 *
 * For more information on bootstrapping your app, check out:
 * http://sailsjs.org/#/documentation/reference/sails.config/sails.config.bootstrap.html
 */

var GCDB = require('gcdb'),//require('gcdb'),
	mysql = require('mysql');

module.exports.bootstrap = function (cb) {

	// Init global vars

	global.appConfig = require('./local.js');

	global.gcdb = new GCDB({
		sitedb: appConfig.db.site,
		usersdb: appConfig.db.users,
		apidb: appConfig.db.api
	});

	global.gcdb.appdb = mysql.createPool(appConfig.db.app);

	global.staffs = [
		'rena4ka',
		'feyola',
		'kernel',
		'mushroomkiller',
		'mushro_om',
		'fluffy',
		'tort32',
		'destr'
	];

	var redis = require('redis').createClient();

	if (appConfig.db.redis.pass) redis.auth(appConfig.db.redis.pass);

	redis.select(appConfig.db.redis.db.session);

	redis.on('error', function (err) {
	  console.log("[REDIS][ERR]: " + err);
	});

	global.redis = redis;

	// It's very important to trigger this callback method when you are finished
	// with the bootstrap!  (otherwise your server will never lift, since it's waiting on the bootstrap)
	cb();
};
