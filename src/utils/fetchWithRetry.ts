import axios from "axios";
import { randomSleep } from "./common";
import { myLog } from "./log";
import { INTERVAL } from "../item";

export const fetchWithRetry = async (
  url: string,
  maxAttempts: number = 5,
  delay: number = INTERVAL
): Promise<any> => {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const response = await axios.get(url);
      return response; // 或者 return response，取决于你需要的信息
    } catch (error) {
      myLog(`Failed to fetch URL: ${url}, attempts: ${attempts}`);
      attempts += 1;
      if (attempts >= maxAttempts) {
        throw new Error(`Failed to fetch URL after ${maxAttempts} attempts.`);
      }
      await randomSleep(delay);
    }
  }
};
