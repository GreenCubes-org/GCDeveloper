/**
 * Default model configuration
 * (sails.config.models)
 *
 * Unless you override them, the following properties will be included
 * in each of your models.
 *
 * For more info on Sails models, see:
 * http://sailsjs.org/#/documentation/concepts/ORM
 */

var appConfig = require('./local.js');

module.exports.models = {
	connection: 'appMySQL',

	migrate: appConfig.migrate || 'alter'
};
