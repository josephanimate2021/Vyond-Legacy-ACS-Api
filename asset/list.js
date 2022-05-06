var files;
const loadPost = require("../misc/post_body");
const header = process.env.XML_HEADER;
const fUtil = require("../misc/file");
const nodezip = require("node-zip");
const base = Buffer.alloc(1, 0);
const asset = require("./main");
const starter = require("../starter/main");
const http = require("http");

async function listAssets(data, makeZip) {
	var xmlString;
	switch (data.type) {
		case "char": {
			var themeId;
			switch (data.themeId) {
				case "custom": {
					themeId = "family";
					break;
				}
				case "action": {
					themeId = "cc2";
					break;
				}
				default: {
					themeId = data.themeId;
					break;
				}
			}
			const chars = await asset.chars(themeId);
			xmlString = `${header}<ugc more="0">${chars
				.map(
					(v) =>
						`<char id="${v.id}" name="Untitled" cc_theme_id="${v.theme}" thumbnail_url="/char_thumbs/${v.id}.png" copyable="Y"><tags/></char>`
				)
				.join("")}</ugc>`;
			break;
		}
		case "bg": {
			files = asset.list(data.movieId, "bg");
			xmlString = `${header}<ugc more="0">${files
				.map((v) => `<background id="${v.id}" name="${v.name}" enable="Y"/>`)
				.join("")}</ugc>`;
			break;
		}
		case "sound": {
			files = asset.list(data.movieId, "sound");
			xmlString = `${header}<ugc more="0">${files
				.map((v) =>`<sound subtype="${v.subtype}" id="${v.id}" name="${v.name}" enable="Y" duration="${v.duration}" downloadtype="progressive"/>`)
				.join("")}</ugc>`;
			break;
		}

		case "movie": {
			files = starter.list()
			xmlString = `${header}<ugc more="0">${files
				.map((v) =>`<movie id="${v.id}" path="/_SAVED/${v.id}" numScene="1" title="${v.id}" thumbnail_url="/starter_thumbs/${v.id}.png"><tags></tags></movie>`)
				.join("")}</ugc>`;
			break;
		}
		case "prop": {
			files = asset.list(data.movieId, "prop");
			xmlString = `${header}<ugc more="0">${files
				.map((v) =>`<prop subtype="0" id="${v.id}" name="${v.id}" enable="Y" holdable="0" headable="0" placeable="1" facing="left" width="0" height="0" asset_url="/_CACHÉ/${data.movieId}.${v.id}"/>`)
				.join("")}</ugc>`;
                        break;
		}
		default: {
			xmlString = `${header}<ugc more="0"></ugc>`;
			break;
		}
	}

	if (makeZip) {
		const zip = nodezip.create();
		fUtil.addToZip(zip, "desc.xml", Buffer.from(xmlString));

		files.forEach((file) => {
			switch (file.mode) {
				case "bg":
				case "movie":
				case "sound":
				case "effect":
				case "prop": {
					const buffer = asset.load(data.movieId, file.id);
					fUtil.addToZip(zip, `${file.mode}/${file.id}`, buffer);
					break;
				}
			}
		});
		return await zip.zip();
	} else {
		return Buffer.from(xmlString);
	}
}

/**
 * @param {http.IncomingMessage} req
 * @param {http.ServerResponse} res
 * @param {import("url").UrlWithParsedQuery} url
 * @returns {boolean}
 */
module.exports = function (req, res, url) {
	var makeZip = false;
	switch (url.pathname) {
		case "/goapi/getUserAssets/": 
		case "/api_v2/assets/team":
		case "/api_v2/assets/shared": { 
			makeZip = true;
			break; 
		}
		case "/goapi/getUserAssetsXml/": 
			break;
		case "/goapi/deleteUserTemplate/":
			starter.delete();
			break;
		default: 
		return;
	}

	switch (req.method) {
		case "GET": {
			var q = url.query;
			if (q.movieId && q.type) {
				listAssets(q, makeZip).then((buff) => {
					const type = makeZip ? "text/xml" : "application/zip";
					res.setHeader("Content-Type", type);
					res.end(buff);
				});
				return true;
			} else return;
		}
		case "POST": {
			loadPost(req, res)
				.then(([data]) => listAssets(data, makeZip))
				.then((buff) => {
					const type = makeZip ? "text/xml" : "application/zip";
					res.setHeader("Content-Type", type);
					if (makeZip) res.write(base);
					res.end(buff);
				});
			return true;
		}
		default:
			return;
	}
};
