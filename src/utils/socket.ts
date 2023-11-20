import {WebSocket} from "ws";

type SocketType = "sub" | "unsub";

interface DefaultType {
  path: string;
  nonce: number;
  type: SocketType;
}

type CallbackInit = (socket: WebSocket) => void | Promise<void>;
type Callback<TypeMessage extends DefaultType> = (socket: WebSocket, message: TypeMessage) => void | Promise<void>;

class SocketRouter {
  private initialFuncs: {func: CallbackInit}[] = [];
  private finnalyFuncs: {func: CallbackInit}[] = [];
  private messageFuncs: {path: string; type: SocketType; func: Callback<any>}[] = [];

  constructor() {
    this.onStart = this.onStart.bind(this);
    this.onEnd = this.onEnd.bind(this);
    this.onMessage = this.onMessage.bind(this);
    this.initial = this.initial.bind(this);
    this.message = this.message.bind(this);
    this.ends = this.ends.bind(this);
  }

  onStart(...callbacks: CallbackInit[]) {
    for (let indexCallback = 0; indexCallback < callbacks.length; indexCallback++) {
      const callback = callbacks[indexCallback];
      this.initialFuncs.push({func: callback});
    }
  }

  onEnd(...callbacks: CallbackInit[]) {
    for (let indexCallback = 0; indexCallback < callbacks.length; indexCallback++) {
      const callback = callbacks[indexCallback];
      this.finnalyFuncs.push({func: callback});
    }
  }

  onMessage<TypeMessage extends DefaultType>(path: string, type: SocketType, ...callbacks: Callback<TypeMessage>[]) {
    for (let indexCallback = 0; indexCallback < callbacks.length; indexCallback++) {
      const callback = callbacks[indexCallback];
      this.messageFuncs.push({path, type, func: callback});
    }
  }

  async initial(socket: WebSocket) {
    for (let indexInitial = 0; indexInitial < this.initialFuncs.length; indexInitial++) {
      const initial = this.initialFuncs[indexInitial];
      await initial.func(socket);
    }
  }

  async message(path: string, type: SocketType, message: any, socket: WebSocket) {
    for (let indexMessage = 0; indexMessage < this.messageFuncs.length; indexMessage++) {
      const messageCallback = this.messageFuncs[indexMessage];
      if (path === messageCallback.path && type === messageCallback.type) await messageCallback.func(socket, message);
    }
  }

  async ends(socket: WebSocket) {
    for (let indexEnd = 0; indexEnd < this.finnalyFuncs.length; indexEnd++) {
      const end = this.finnalyFuncs[indexEnd];
      await end.func(socket);
    }
  }
}

export default new SocketRouter();
