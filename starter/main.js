const exFolder = process.env.EXAMPLE_FOLDER;
const caché = require("../asset/caché");
const fUtil = require("../misc/file");
const nodezip = require("node-zip");
const parse = require("../movie/parse");
const fs = require("fs");
const truncate = require("truncate");

module.exports = {
	/**
	 *
	 * @param {Buffer} starterZip
	 * @returns {Promise<string>}
	 */
	save(starterZip, thumb) {
		return new Promise(async (res, rej) => {
			var sId = fUtil.getNextFileId("starter-", ".xml");
			var zip = nodezip.unzip(starterZip);
			
			const thumbFile = fUtil.getFileIndex("starter-", ".png", sId);
			fs.writeFileSync(thumbFile, thumb);
			var path = fUtil.getFileIndex("starter-", ".xml", sId);
			var writeStream = fs.createWriteStream(path);
			var assetBuffers = caché.loadTable(sId);
			parse.unpackMovie(zip, thumb, assetBuffers).then((data) => {
				writeStream.write(data, () => {
					writeStream.close();
					res("s-" + sId);
				});
			});
				
				
		});
	},
	delete() {
		return new Promise(async (res, rej) => {
			var starterId = fUtil.getValidFileIndicies("starter-", ".xml");
			var moviePath = fUtil.getFileIndex("starter-", ".xml", starterId);
			var thumbPath = fUtil.getFileIndex("starter-", ".png", starterId);
			fs.unlinkSync(moviePath);
			fs.unlinkSync(thumbPath);
			caché.clearTable("s-" + starterId);
			res("s-" + starterId);
			
		});
	},
	thumb(movieId) {
		return new Promise(async (res, rej) => {
			if (!movieId.startsWith("s-")) return;
			const n = Number.parseInt(movieId.substr(2));
			const fn = fUtil.getFileIndex("starter-", ".png", n);
			isNaN(n) ? rej() : res(fs.readFileSync(fn));
		});
	},
	list() {
		const table = [];
		var ids = fUtil.getValidFileIndicies("starter-", ".xml");
		for (const i in ids) {
			var id = `s-${ids[i]}`;
			table.unshift({ id: id });
		}
		return table;
	},
	/* i don't know. because i did some lvm research and you need a meta to store all data including starter data. but i don't know on how i am going to give the asset metadata thing to the starters though.
	meta(movieId) {
		return new Promise(async (res, rej) => {
			if (!movieId.startsWith("s-")) return;
			const n = Number.parseInt(movieId.substr(2));
			const fn = fUtil.getFileIndex("starter-", ".xml", n);

			const fd = fs.openSync(fn, "r");
			const buffer = Buffer.alloc(256);
			fs.readSync(fd, buffer, 0, 256, 0);
			const begTitle = buffer.indexOf("<title>") + 16;
			const endTitle = buffer.indexOf("]]></title>");
			const title = buffer.slice(begTitle, endTitle).toString().trim();

			fs.closeSync(fd);
			res({
				date: fs.statSync(fn).mtime,
				title: title,
				id: movieId,
			});
		});
	},
	*/
};
