// 等待X秒
export const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time * 1000));

// 随机等待X秒左右。若传入5，则等待4-6秒
export const randomSleep = (time: number, random: number = 0.2) =>
  sleep(time + (1 - Math.random()) * random);

export const countCharInString = (str: string, char: string) => {
  const matches = str.match(new RegExp(char, "g"));
  return matches ? matches.length : 0;
};
