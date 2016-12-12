'use strict';

const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
// const mkdirp = require('mkdirp');
const glob = require('glob');

function WebpackArchivePlugin(options = {}) {
	if(typeof options === 'string') {
		this.options = {output: options};
	} else {
		this.options = options;
	}
}

WebpackArchivePlugin.prototype.apply = function(compiler) {
	const options = this.options;
	compiler.plugin('after-emit', function(compiler, callback) {
		// Set output location
		const output = options.output?
			options.output:compiler.options.output.path;

		// Create archive streams
		let streams = [];
		let zip = true;
		let tar = true;
		if(options.format) {
			if(typeof options.format === 'string') {
				zip = (options.format === 'zip');
				tar = (options.format === 'tar');
			} else if(Array.isArray(options.format)) {
				zip = (options.format.indexOf('zip') != -1);
				tar = (options.format.indexOf('tar') != -1);
			}
		}
		if(zip) {
			let stream = archiver('zip');
			stream.pipe(fs.createWriteStream(`${output}.zip`));
			streams.push(stream);
		}
		if(tar) {
			let stream = archiver('tar', {
				gzip: true,
				gzipOptions: {
					level: 1
				}
			});
			stream.pipe(fs.createWriteStream(`${output}.tar.gz`));
			streams.push(stream);
		}

		// Add assets
    const assets = glob.sync(options.entry, { nodir: true });

    assets.forEach(function (asset) {
      for(let stream of streams) {
        stream.append(fs.createReadStream(asset), {name: path.basename(asset)});
      }
    });

		// Finalize streams
		for(let stream of streams) {
			stream.finalize();
		}

		callback();
	});
}

module.exports = WebpackArchivePlugin;
