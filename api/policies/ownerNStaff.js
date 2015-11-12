/**
 * Allow only owners and staffs
 */

module.exports = function(req, res, ok) {
	var appid = parseInt(req.param('id'), 10);

	if (req.user.staff) {
		return ok();
	}

	gcdb.apidb.query('SELECT * FROM `client` WHERE `id` = ?', [appid], function (err, result) {
		if (err) return res.serverError(err);

		if (result[0].owner === req.user.id) {
			ok();
		} else {
			res.forbidden();
		}
	});
};
