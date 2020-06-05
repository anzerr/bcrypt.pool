
const {Executors} = require('@anzerr/thread.node');

class BcryptPool {

	constructor(size, hashRound = 12) {
		this.size = size;
		this.hashRound = hashRound;
		this.pool = Executors.threadPool(this.size);
	}

	hash(str) {
		if (str.length > 255) {
			return Promise.reject(new Error('max str size is 255'));
		}
		const buffer = new SharedArrayBuffer(255 + 2), t = Buffer.from(buffer);
		t.writeUInt8(this.hashRound);
		t.writeUInt8(str.length, 1);
		t.write(str, 2);

		// the sumbit code is code that runs in a fork
		return this.pool.submit(async (d) => {
			const bcrypt = require('bcryptjs');

			const data = Buffer.from(d),
				str = data.slice(2, data[1] + 2).toString(),
				out = bcrypt.hashSync(str, data[0]);
			Buffer.from(d).write(out);
		}, buffer).then(() => {
			return Buffer.from(buffer).toString(undefined, 0, 60);
		});
	}

	compare(str, hash) {
		if (str.length > 255) {
			throw new Error('max str size is 255');
		}
		if (hash.length > 72) {
			throw new Error('a valid hash should be between 50-72 in length');
		}
		const size = str.length + hash.length + 1,
			buffer = new SharedArrayBuffer(size), 
			t = Buffer.from(buffer);
		t.writeUInt8(str.length);
		t.write(str, 1);
		t.write(hash, 1 + str.length);

		// the sumbit code is code that runs in a fork
		return this.pool.submit(async (d) => {
			const bcrypt = require('bcryptjs');
			
			const data = Buffer.from(d);
			const str = data.toString(undefined, 1, data[0] + 1),
				hash = data.toString(undefined, 1 + data[0], data.length);
			data.writeUInt8(bcrypt.compareSync(str, hash) ? 1 : 0);
		}, buffer).then(() => {
			return Boolean(new Uint8Array(buffer)[0]);
		});
	}

	close() {
		this.pool.close();
	}

}

module.exports = BcryptPool;
module.exports.default = BcryptPool;