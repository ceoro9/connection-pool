import { spliceElement } from './utils';

interface Connectable {
  close(): void;
  ping?(): void;
  // TODO: add ping method
}

// Wrapper around provided connection type
type PoolConnection<T> = T & { release: () => void };

interface ConnectionCB<T> {
  (err: Error, connection: PoolConnection<T>): void;
}

export class ConnectionsPool<T extends Connectable> {

  private allConnections:      Array<T> = [];
  private freeConnections:     Array<T> = [];
  private acquiredConnections: Array<T> = [];
  
  private queuedCBs: Array<ConnectionCB<T>> = [];
  private pendingConnectionsCount = 0;
  private closed = false;

  constructor(private readonly connectionLimit: number,
              private readonly getNewConnection: () => Promise<T>) {}

  getConnection(cb: ConnectionCB<T>, waitForConnection: boolean = true): void {
    if (this.closed) {
      process.nextTick(() => cb(new Error('Pool is closed'), undefined));
      return;
    }

    // open new connection
    if (this.connectionLimit > this.allConnections.length + this.pendingConnectionsCount) {
      
      this.pendingConnectionsCount += 1;
      
      this.getNewConnection().then((newConnection: T) => {
        
        this.pendingConnectionsCount -= 1;
        
        this.allConnections.push(newConnection);  
        this.acquireConnection(newConnection, cb);

      }).catch(err => {
        
        this.pendingConnectionsCount -= 1;

        cb(err, undefined)
      });
      
      return;
    }

    // check free connections
    if (this.freeConnections.length) {
      const connection = this.freeConnections.shift();
      this.acquireConnection(connection, cb);
      return;
    }

    // no available connections
    if (!waitForConnection) {
      process.nextTick(() => cb(new Error('No available connections'), undefined));
      return;
    }

    // put callback to queue to execute it after somebody releases connection
    this.queuedCBs.push(cb);
  }

  private getPoolConnection(connection: T): PoolConnection<T> {
    return {
      ...connection,
      release: () => this.releaseConnection(connection),
    }
  }

  acquireConnection(connection: T, cb: ConnectionCB<T>): void {
    
    this.acquiredConnections.push(connection);

    cb(null, this.getPoolConnection(connection));
  }

  releaseConnection(connection: T): void {

    if (this.acquiredConnections.indexOf(connection) === -1) {
      throw new Error('Connection was not acquired to release it')
    }

    if (this.freeConnections.indexOf(connection) !== -1) {
      throw new Error('Connection has already been released');
    } else {
      this.freeConnections.push(connection);
    }

    if (this.queuedCBs.length) {
      this.getConnection(this.queuedCBs.shift());
    }
  }

  removeConnection(connection: T) {

    spliceElement(this.allConnections, connection);

    spliceElement(this.freeConnections, connection);

    this.releaseConnection(connection);
  }

  close(): void {
    this.allConnections.forEach(conn => conn.close());
    this.closed = true;
  }
}
