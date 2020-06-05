
### `Intro`
Create a pool of forked workers that will run hash/compare instead of the main thread useful for api to not block the event loop. This uses bcryptjs so should work everywhere without needing to compile.

#### `Install`
``` bash
npm install --save git+https://git@github.com/anzerr/bcrypt.pool.git
npm install --save @anzerr/bcrypt.pool
```

### `Example`
``` javascript
const BcryptPool = require('bcrypt.pool');

const p = new BcryptPool(4, 12); // will creat 4 workers with 12 hash rounds

Promise.all([
    p.hash('test'),
    p.hash('test'),
    p.hash('test'),
    p.hash('test')
]).then((a) => {
    return Promise.all([
        p.compare('test', a[0]),
        p.compare('test', a[1]),
        p.compare('test', a[2]),
        p.compare('test', a[3])
    ]);
}).then((res) => {
    console.log(res);
});
```