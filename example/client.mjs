import * as net from 'net';
import Pool from '../build/index';

const ConnectionsPool = Pool.default;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const getConnection = async () => {
  return new Promise((resolve, reject) => {
    
    const client = net.createConnection({ port: 8000 }, (conn) => {
      console.log('connected to server');
      resolve({
        ...client,
        close: () => client.destroy(),
      });
    });

    client.on('data', function (data) {
      console.log(data.toString());
      client.end();
    });

    client.on('end', function () {
      console.log('disconnected from server');
    });

    client.on('error', (err) => {
      console.log('Error while establishing connection');
      reject(err);
    });
  });
}

const pool = new ConnectionsPool(2, getConnection);

async function handle(name) {
  console.log(`${name}'s started work`);
  try {
    
    const conenction = await pool.getConnection();
  
    await sleep(3000);  // making some operations
    conenction.release();
    
    console.log(`${name}'s finished its work`)
  } catch (e) {
    console.log(`${name}'s obtained connection. Error = ${err}`)
  }
}

console.log('starting ...');
(async function () {
    await Promise.all([
      handle('worker_1'),
      handle('worker_2'),
      handle('worker_3'),
      handle('worker_4'),
      handle('worker_5'),
    ]);
    console.log(`Pool size: ${pool.allConnections.length}`);
    console.log('handled');
    pool.close();
    console.log('pool is closed')
})();
