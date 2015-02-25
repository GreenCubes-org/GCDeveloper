/**
 * Requests
 *
 * @module      :: 	Model
 * @description ::	Request model
 *
 */

module.exports = {

	attributes: {

		name: {
			type: 'STRING',
			required: true
		},

		redirectURI: {
			type: 'STRING',
			required: true
		},

		homeURI: {
			type: 'STRING',
			required: true
		},

		owner: {
			type: 'INTEGER',
			required: true
		},

		scope: {
			type: 'STRING',
			required: true
		},

		description: {
			type: 'STRING',
			required: true
		},

		accepted: {
			type: 'BOOLEAN',
			required: true
		}

	}

};