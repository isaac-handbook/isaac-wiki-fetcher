import { IS_ALL, TYPE, cleanAllItems } from "./item";

const main = async () => {
  if (IS_ALL) {
    cleanAllItems("item");
    cleanAllItems("trinket");
    cleanAllItems("card");
    cleanAllItems("pill");
  } else {
    cleanAllItems(TYPE);
  }
};

main();
