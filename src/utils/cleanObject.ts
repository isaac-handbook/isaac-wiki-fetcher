export function cleanObject(obj: any) {
  Object.keys(obj).forEach((key) => {
    const value = obj[key];
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      // 删除满足条件的叶子节点
      delete obj[key];
    } else if (typeof value === "object") {
      cleanObject(value); // 递归调用以处理子对象
      if (Object.keys(value).length === 0) {
        // 如果递归清理后的对象为空，则也将其删除
        delete obj[key];
      }
    }
  });
  return obj;
}
