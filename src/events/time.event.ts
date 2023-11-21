import EventEmitter from "../utils/event";

const delay = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const eventTime = new EventEmitter<number>();

export async function startTimerEvent() {
  return new Promise(async (resolve) => {
    let isTime = true;
    resolve(() => (isTime = false));
    while (isTime) {
      eventTime.emit(Date.now());
      await delay(1000);
    }
  });
}
