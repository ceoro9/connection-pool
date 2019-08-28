import { spliceElement } from './utils';

interface Connectable {
  close(): void;
}

// Does not allow release property on provided connection type,
// because it's going to be re-defined by PoolConnection.
type ProvidedConnection<T>= "release" extends keyof T ? never : T;

// Wrapper around provided connection type
type PoolConnection<T> = T & { release: () => void };

interface ConnectionPromise<T> {
  resolve(connection: PoolConnection<T>): void;
  reject (error: Error): void;
}

export class ConnectionsPool<T extends Connectable> {

  private allConnections:      Array<T> = [];
  private freeConnections:     Array<T> = [];
  private acquiredConnections: Array<T> = [];
  
  private queuedPromises: Array<ConnectionPromise<T>> = [];
  private pendingConnectionsCount = 0;
  private closed = false;

  public constructor(private readonly connectionLimit: number,
                     private readonly getNewConnection: () => Promise<ProvidedConnection<T>>) {}

  public async getConnection(waitForConnection: boolean = true): Promise<PoolConnection<T>> {
    return new Promise((resolve, reject) => {
      this.handleConnectionPromise({ resolve, reject }, waitForConnection);
    });
  }

  private async handleConnectionPromise(cp: ConnectionPromise<T>, waitForConnection: boolean = true) {
    // callbacks to resolve/reject promises, returned by getConnection method
    const resolve = (connection: T) => cp.resolve(this.convertToPoolConnection(connection));
    const reject  = cp.reject;
    
    if (this.closed) {
      reject(new Error('Pool is closed'));
      return;
    }

    // open new connection
    if (this.connectionLimit > this.allConnections.length + this.pendingConnectionsCount) {
      
      this.pendingConnectionsCount += 1;
      
      try {
        const newConnection = await this.getNewConnection();
        this.allConnections.push(newConnection);
        this.acquireConnection(newConnection);
        resolve(newConnection);
      } catch (e) {
        reject(e);
      } finally {
        this.pendingConnectionsCount -= 1;
      }

      return;
    }

    // check free connections
    if (this.freeConnections.length) {
      const connection = this.freeConnections.shift();
      this.acquireConnection(connection);
      resolve(connection);
      return;
    }

    // no available connections
    if (!waitForConnection) {
      reject(new Error('No available connections'));
      return;
    }

    // put promise connection to queue to handle it after somebody releases connection
    this.queuedPromises.push(cp);
  }

  public removeConnection(connection: T) {
    spliceElement(this.allConnections, connection);
    spliceElement(this.freeConnections, connection);
    this.releaseConnection(connection);
  }

  public close() {
    this.allConnections.forEach(conn => conn.close());
    this.closed = true;
  }

  private convertToPoolConnection(connection: T): PoolConnection<T> {
    return {
      ...connection,
      release: () => this.releaseConnection(connection),
    }
  }

  private acquireConnection(connection: T) {
    this.acquiredConnections.push(connection);
  }

  private releaseConnection(connection: T) {
    
    if (this.acquiredConnections.indexOf(connection) === -1) {
      throw new Error('Connection was not acquired to release it')
    }

    if (this.freeConnections.indexOf(connection) !== -1) {
      throw new Error('Connection has already been released');
    } else {
      this.freeConnections.push(connection);
    }

    if (this.queuedPromises.length) {
      this.handleConnectionPromise(this.queuedPromises.shift());
    }
  }
}
