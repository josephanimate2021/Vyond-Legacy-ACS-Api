const http = require("http");
const defaultTypes = {
	family: "adam",
	anime: "guy",
	business: "guy",
	whiteboard: "guy",
};

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	if (req.method != "GET" || !url.pathname.startsWith("/go/character_creator")) return;
	var match = /\/go\/character_creator\/(\w+)(\/\w+)?(\/.+)?$/.exec(url.pathname);
	if (!match) return;
	[, theme, mode, id] = match;

	var redirect;
	switch (mode) {
		case "/copy": {
			redirect = `https://josephanimate2021.github.io/lvm-static/createChars?method=copy&themeId=${theme}&charId=${id.substr(1)}`;
			break;
		}
		default: {
			var type = url.query.type || defaultTypes[theme] || "";
			redirect = `https://josephanimate2021.github.io/lvm-static/charRedirect?themeId=${theme}&bs=${type}`;
			break;
		}
	}
	res.setHeader("Location", redirect);
	res.statusCode = 302;
	res.end();
	return true;
};
