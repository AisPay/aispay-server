class EventEmitter {
  private listeners: {nonce: string; func: (...args: any[]) => void}[] = [];

  constructor() {
    this.on = this.on.bind(this);
    this.emit = this.emit.bind(this);
    this.removeListener = this.removeListener.bind(this);
  }

  on(listener: (...args: any[]) => void | Promise<void>, nonce: string) {
    this.listeners.push({nonce, func: listener});
  }

  emit(...args: any[]) {
    for (let indexList = 0; indexList < this.listeners.length; indexList++) {
      const candidate = this.listeners[indexList];
      candidate.func(...args);
    }
  }

  removeListener(nonce: string) {
    let candidate = this.listeners.find((list) => list.nonce === nonce);
    if (candidate) {
      this.listeners = this.listeners.filter(({nonce}) => candidate!.nonce !== nonce);
    }
  }
}

export default EventEmitter;
