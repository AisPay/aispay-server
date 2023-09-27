export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const timer = async (func: () => Promise<void>, ms = 200): Promise<() => void> =>
  new Promise(async (resolve) => {
    let isTime: boolean = true;
    resolve(() => (isTime = false));
    while (isTime) {
      let start = Date.now();
      try {
        await func();
      } catch (e) {}
      let delta = Date.now() - start;
      if (delta < ms) await delay(ms - delta);
    }
  });
