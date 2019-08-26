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

pool.getNewConnection(conn => {
  // some operations
  conn.release();
});

pool.close()
```

### TODO
1. Add unit tests
2. Add more timeout options: `acquireTimeout`, `waitForConnections`, `connectionLimit` and `queueLimit` params.
3. Make `ConnectionPool` to emit events after connection was established, acquired and etc.

### License
This project is licensed under the [MIT](https://choosealicense.com/licenses/mit/) License.
