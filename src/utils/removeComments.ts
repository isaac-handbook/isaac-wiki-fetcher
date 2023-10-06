// 删除注释内容
export function removeComments(str: string) {
  return str
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/[\s\n\t\r]+/g, "")
    .replace(/<ref>[\s\S]*?<\/ref>/g, "");
}
