import { spliceElement } from './utils';

interface Connectable {
  close(): void;
}

interface ConnectionCB<T> {
  (err: Error, connection: T): void;
}

export class ConnectionsPool<T extends Connectable> {

  private _allConnections:      Array<T> = [];
  private _freeConnections:     Array<T> = [];
  private _acquiredConnections: Array<T> = [];
  
  private _queuedCBs: Array<ConnectionCB<T>> = [];
  private _closed = false;

  constructor(private readonly connectionLimit: number, private readonly getNewConnection: () => T) { }

  close(): void {
    this._allConnections.forEach(conn => conn.close());
    this._closed = true;
  }

  getConnection(cb: ConnectionCB<T>, waitForConnection: boolean = true): void {
    if (this._closed) {
      process.nextTick(() => cb(new Error('Pool is closed'), undefined));
      return;
    }

    // open new connection
    if (this.connectionLimit > this._allConnections.length) {
      const newConnection: T = this.getNewConnection();
      this._allConnections.push(newConnection);
      this.acquireConnection(newConnection, cb);
      return;
    }

    // check free connections
    if (this._freeConnections.length) {
      const connection = this._freeConnections.shift();
      this.acquireConnection(connection, cb);
      return;
    }

    // TODO: may be move to constructor
    if (!waitForConnection) {
      process.nextTick(() => cb(new Error('No available connections'), undefined));
      return;
    }

    this._queuedCBs.push(cb);
  }

  acquireConnection(connection: T, cb: ConnectionCB<T>): void {
    
    this._acquiredConnections.push(connection);
    
    cb(null, connection);

    this.releaseConnection(connection);
  }

  releaseConnection(connection: T): void {

    if (this._acquiredConnections.indexOf(connection) === -1) {
      throw new Error('Connection was not acquired to release it')
    }

    if (this._freeConnections.indexOf(connection) !== -1) {
      throw new Error('Connection has already been released');
    } else {
      this._freeConnections.push(connection);
    }

    if (this._queuedCBs.length) {
      this.getConnection(this._queuedCBs.shift());
    }
  }

  removeConnection(connection: T) {

    spliceElement(this._allConnections, connection);

    spliceElement(this._freeConnections, connection);

    this.releaseConnection(connection);
  }
}
