/**
 * Route Mappings
 * (sails.config.routes)
 *
 * Your routes map URLs to views and controllers.
 *
 * If Sails receives a URL that doesn't match any of the routes below,
 * it will check for matching files (images, scripts, stylesheets, etc.)
 * in your assets directory.  e.g. `http://localhost:1337/images/foo.jpg`
 * might match an image file: `/assets/images/foo.jpg`
 *
 * Finally, if those don't match either, the default 404 handler is triggered.
 * See `api/responses/notFound.js` to adjust your app's 404 logic.
 *
 * Note: Sails doesn't ACTUALLY serve stuff from `assets`-- the default Gruntfile in Sails copies
 * flat files from `assets` to `.tmp/public`.  This allows you to do things like compile LESS or
 * CoffeeScript for the front-end.
 *
 * For more information on configuring custom routes, check out:
 * http://sailsjs.org/#/documentation/concepts/Routes/RouteTargetSyntax.html
 main, registerApp, getApp, editApp, deleteApp, listRequests, getRequest, editRequest, deleteRequest
 */

module.exports.routes = {

	'/': {
		view: 'mainpage'
	},


	/* User stuff */
	'/login': 'users.login',
	'/logout': 'users.logout',

	'/oauth2/callback': 'users.callback',


	/* API documentation */
	'/api': {
		view: 'api/generic'
	},

	'/api/authorization': {
		view: 'api/authorization'
	},

	'/api/methods': {
		view: 'api/methods'
	},

	'/api/errors': {
		view: 'api/errors'
	},


	/* Requests */
	'get /apps/register': 'requests.registerView',
	'post /apps/register': 'requests.register',
	//'get /apps/requests': 'requests.listRequests',
	'get /apps/requests/:id': 'requests.get',
	'post /apps/requests/:id': 'requests.edit',
	'post /apps/requests/:id/status': 'requests.changeStatus',


	/* Applications */
	'/apps': 'apps.list',

	'get /apps/:id': 'apps.get',
	'post /apps/:id': 'apps.edit',
	'post /apps/:id/regeneratekey': 'apps.regenerateKey',
	'post /apps/:id/changeowner': 'apps.changeOwner',
	'delete /apps/:id': 'apps.delete',


	/* Sessions */
	'/sessions': 'sessions.list',
	'/sessions/:id': 'sessions.delete'
};
