'use strict';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Deletes files generated by the extension.
 */
 export function clearCache(filename : string) {
	const cache = path.join(filename, '..', '..', 'resources', 'swatches', 'generated');
	fs.readdir(cache, (err, files) => {
		if (err) throw err;
		for (const file of files) {
			if (file !== '.index') {
				fs.unlink(path.join(cache, file), (err) => {
					if (err) throw err;
				});
			}
		}
	});
}