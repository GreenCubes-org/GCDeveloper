/**
 * User
 *
 * @module      :: 	Model
 * @description ::	User model
 *
 */

module.exports = {

	attributes: {
		// User id
		uid: 'integer',

		// Game id
		gameId: 'integer',

		// User group
		staff: 'boolean',

		// Language
		locale: 'string'

	}

};
