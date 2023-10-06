import { Item } from "./type";

function removeUnwantedContent(data) {
  // 首先判断data是否为一个有效的对象，并且包含content属性
  if (typeof data !== "object" || !data.content) return;

  // 递归函数处理content中的每一项
  function recursiveHandler(content) {
    for (let i = 0; i < content.length; i++) {
      // 以}}:结尾，且没有子元素的，删除
      if (
        content[i].value.endsWith("}}：") &&
        content[i].children.length === 0
      ) {
        content.splice(i, 1);
        // 由于splice改变了数组的索引，所以i需要减1
        i--;
        continue;
      }
      // level=0，且没有子元素的，删除
      if (content[i].level === 0 && content[i].children.length === 0) {
        content.splice(i, 1);
        i--;
        continue;
      }
      // 递归处理children
      if (content[i].children && content[i].children.length > 0) {
        recursiveHandler(content[i].children);
      }
    }
  }

  // 调用递归函数处理data.content
  recursiveHandler(data.content);
  return data;
}

// 格式化Item对象
export const formatItemObject = (itemObject: Item) => {
  let item = itemObject;

  // 为啥要处理两遍？
  // 第一遍可能清理了某个 children为空，但是这个 children的父元素还是存在的
  item = removeUnwantedContent(item);
  item = removeUnwantedContent(item);

  // 判断
  return item;
};
