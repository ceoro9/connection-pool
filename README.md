# Connection Pool
General service-agnostic implemention of simple connection pool in TypeScript.

### Installation
```
npm install
```

###  Compiling
```
npm run build
```

### Usage
```
import ConnectionPool from 'connection-pool';

const getNewConnection = () => new Promise(...);
const pool = new ConnectionsPool(5, getNewConnection);

(async function () {
  try {
    const connection = await pool.getConnection();
    // some operations
    connection.release();
  } catch (e) {
    console.log(e);
  } finally {
    pool.close();
  }
})();
```

### TODO
1. Add unit tests
2. Make `ConnectionPool` to emit events after connection was established, acquired and etc.

### License
This project is licensed under the [MIT](https://choosealicense.com/licenses/mit/) License.
