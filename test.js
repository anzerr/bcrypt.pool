
const bcrypt = require('bcryptjs'),
	promise = require('@anzerr/promise.util'),
	assert = require('assert'),
	crypto = require('crypto'),
	BcryptPool = require('./index');

class Test {

	constructor() {
		this.pool = new BcryptPool(4, 12);
	}

	valid(o1, o2) {
		for (let i in o1) {
			assert.equal(o1[i], true);
			assert.notEqual(o2[i].match(/^\$2a\$12\$.{50,72}$/), null);
		}
	}

	test_pool() {
		let o1 = [], o2 = [];
		return promise.measure(() => {
			return Promise.all([
				this.pool.hash('test'),
				this.pool.hash('test'),
				this.pool.hash('test'),
				this.pool.hash('test')
			]).then((a) => {
				o2 = a;
				return Promise.all([
					this.pool.compare('test', a[0]),
					this.pool.compare('test', a[1]),
					this.pool.compare('test', a[2]),
					this.pool.compare('test', a[3])
				]);
			}).then((a) => {
				o1 = a;
			});
		}).then((res) => {
			this.valid(o1, o2);
			console.log('pool speed', (res / 1e9).toFixed(3), o1, o2);
		})
	}

	test_raw() {
		let o1 = [], o2 = [];
		return promise.measure(() => {
			for (let i = 0; i < 4; i++) {
				let h = bcrypt.hashSync('test', 12);
				o2.push(h);
				o1.push(bcrypt.compareSync('test', h));
			}
			return Promise.resolve();
		}).then((r) => {
			this.valid(o1, o2);
			console.log('raw speed', (r / 1e9).toFixed(3), o1, o2);
		});
	}

	testHash(str) {
		console.log('test str', str.length);
		return this.pool.hash(str).then((res) => {
			return this.pool.compare(str, res);
		}).then((res) => {
			assert.equal(res, true);
			console.log('test str valid', res, str.length);
		});
	}

	test_values() {
		return this.testHash('test').then(() => {
			return this.testHash(crypto.randomBytes(20).toString());
		}).then(() => {
			return this.testHash(crypto.randomBytes(40).toString());
		}).then(() => {
			return this.testHash(crypto.randomBytes(60).toString());
		}).then(() => {
			return this.testHash(crypto.randomBytes(80).toString());
		}).then(() => {
			return this.testHash(crypto.randomBytes(100).toString());
		}).then(() => {
			return this.testHash(crypto.randomBytes(200).toString());
		}).then(() => {
			return this.testHash(crypto.randomBytes(255).toString());
		}).then(() => {
			return this.testHash(crypto.randomBytes(300).toString()).then(() => {
				console.log('test failed should have failed on max hash size');
				process.exit(1);
			}).catch((err) => {
				assert.equal(err.toString(), 'Error: max str size is 255');
			});
		});
	}

	close() {
		this.pool.close();
	}

}

const t = new Test();
t.test_pool().then(() => {
	return t.test_raw();
}).then(() => {
	return t.test_values();
}).then(() => {
	t.close();
}).catch((e) => {
	console.log('test failed', e);
	process.exit(1);
});
