import tokenService from "../services/token.service";

const delay = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function startTimerClearToken() {
  return new Promise(async (resolve) => {
    let isTime = true;
    resolve(() => (isTime = false));
    while (isTime) {
      await tokenService.autoClearTokens();
      await delay(600000);
    }
  });
}
