
const {Executors} = require('@anzerr/thread.node');

class BcryptPool {

	constructor(size, hashRound = 12) {
		this.size = size;
		this.hashRound = hashRound;
		this.pool = Executors.threadPool(this.size);
	}

	hash(str) {
		if (str.length > 255) {
			throw new Error('max str size is 255');
		}
		const buffer = new SharedArrayBuffer(255 + 2), t = Buffer.from(str);
		const a = new Uint8Array(buffer);
		a[0] = this.hashRound;
		a[1] = str.length;
		for (let i = 0; i < t.length; i++) {
			a[i + 2] = t[i];
		}
		// the sumbit code is code that runs in a fork
		return this.pool.submit(async (d) => {
			const bcrypt = require('bcryptjs');

			const data = Buffer.from(d),
				str = data.slice(2, data[1] + 2).toString(),
				out = bcrypt.hashSync(str, data[0]);
			Buffer.from(d).fill(0).write(out);
		}, buffer).then(() => {
			const b = Buffer.from(buffer);
			for (let i = 0; i < b.length; i++) {
				if (!b[i]) {
					return b.slice(0, i).toString();
				}
			}
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
		t.writeInt8(str.length);
		t.write(str, 1);
		t.write(hash, 1 + str.length);
		// the sumbit code is code that runs in a fork
		return this.pool.submit(async (d) => {
			const bcrypt = require('bcryptjs');
			
			const data = Buffer.from(d);
			const str = data.toString(undefined, 1, data[0] + 1),
				hash = data.toString(undefined, 1 + data[0], data.length);
			data.writeInt8(bcrypt.compareSync(str, hash) ? 1 : 0);
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