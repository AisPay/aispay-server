class EventEmitter<TypeEmit> {
  private listeners: {nonce: string; func: (body: TypeEmit) => void}[] = [];

  constructor() {
    this.on = this.on.bind(this);
    this.emit = this.emit.bind(this);
    this.removeListener = this.removeListener.bind(this);
  }

  on(listener: (body: TypeEmit) => void | Promise<void>, nonce: string) {
    this.listeners.push({nonce, func: listener});
  }

  emit(body: TypeEmit) {
    for (let indexList = 0; indexList < this.listeners.length; indexList++) {
      const candidate = this.listeners[indexList];
      candidate.func(body);
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
