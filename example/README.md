## Running

### Launch server
```
node --experimental-modules server.mjs
```

### Launch client
```
node --experimental-modules client.mjs
```

### Check logs
Workers should obtain connection one by one according to the size of pool.
```
starting ...
worker_1's started work
worker_2's started work
worker_3's started work
worker_4's started work
worker_5's started work
connected to server
worker_1's obtained connection. Error = null
connected to server
worker_2's obtained connection. Error = null
goodbye
goodbye
disconnected from server
disconnected from server
worker_3's obtained connection. Error = null
worker_1's finished its work
worker_4's obtained connection. Error = null
worker_2's finished its work
worker_5's obtained connection. Error = null
worker_3's finished its work
worker_4's finished its work
worker_5's finished its work
Pool size: 2
handled
pool is closed
```