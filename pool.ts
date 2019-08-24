import { EventEmitter } from "events";

interface Connectable {
  new(host: string, port: number);
  open(): void;
  close(): void;
}

function createInstance<T>(c: {new(...params: Array<any>): T}, args: Array<any>): T {
  return new c(...args);
}

interface ConnectionCB<T> {
  (err: Error, connection: T): void;
}

export class ConnectionsPool<T extends Connectable> extends EventEmitter {

  private _allConnections:      Array<T> = [];
  private _freeConnections:     Array<T> = [];
  private _acquiredConnections: Array<T> = [];
  
  private _queuedCBs: Array<ConnectionCB<T>> = [];
  private _closed = false;

  constructor(private connectionLimit: number, private getNewConnection: () => T) {
    super();
  }

  close(): void {
    this._allConnections.forEach(conn => conn.close());
    this._closed = true;
  }

  getConnection(cb: ConnectionCB<T>, waitForConnection: boolean = true): T {
    if (this._closed) {
      process.nextTick(() => cb(new Error('Pool is closed'), undefined));
      return;
    }

    // open new connection
    if (this.connectionLimit < this._allConnections.length) {
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

    this.emit('acquire', connection);
    cb(null, connection);
  }

  releaseConnection(connection: T): void {
    if (this._acquiredConnections.indexOf(connection) !== -1) {
      return;
    }

    if (this._freeConnections.indexOf(connection) !== -1) {
      throw new Error('Connection has already been released');
    } else {
      this._freeConnections.push(connection);
      this.emit('release', connection);
    }

    if (this._queuedCBs.length) {
      this.getConnection(this._queuedCBs.shift());
    }
  }
}
