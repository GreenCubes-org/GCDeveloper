/**
 * Allow any authenticated user.
 */
module.exports = function (req, res, ok) {

	// User is allowed, proceed to controller
	if (req.user) {
		return ok();
	} else {
		if (req.wantsJSON) {
			res.json(403, {error: 403});
		} else {
			res.redirect('/login');
		}
	}
};
