import { myCache } from "../app.js";
import { Order } from "../models/order/order.model.js";
import { Product } from "../models/product/product.model.js";
import { ClearCacheProps, OrderItemType } from "../types/types.js";

export const ClearCache = ({
  product,
  order,
  admin,
  userId,
  orderId,
  productId,
}: ClearCacheProps) => {
  if (product) {
    const productKeys: string[] = [
      "latest-products",
      "categories",
      "get-admin-products",
    ];
    if (typeof productId == "string") productKeys.push(`product-${productId}`);

    if (typeof productId === "object") {
      productId.forEach((id) => productKeys.push(`product-${id}`));
      console.log("productid is an array");
    }
    myCache.del(productKeys);
  }
  if (order) {
    const ordersKeys: string[] = [
      "all-orders",
      `my-orders-${userId}`,
      `order-${orderId}`,
    ];
    myCache.del(ordersKeys);
  }
  if (admin) {
    const adminKeys: string[] = [
      "admin-stats",
      "admin-pie-charts",
      "admin-bar-charts",
      "admin-line-charts",
    ];
    myCache.del(adminKeys);
  }
};

export const reduceStock = async (orderItems: OrderItemType[]) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const product = await Product.findById(order.productId);
    if (!product) throw new Error("product Not Found");
    product.stock -= order.quantity;
    await product.save();
  }
};

export const calculatePercentage = (thisMonth: number, lastMonth: number) => {
  if (lastMonth === 0) {
    return thisMonth * 100;
  }
  const percent = (thisMonth / lastMonth) * 100;
  return Number(percent.toFixed(0));
};

export const getInventories = async ({
  categories,
  productsCount,
}: {
  categories: string[];
  productsCount: number;
}) => {
  const categoriesCountPromise = categories.map((category) =>
    Product.countDocuments({ category })
  );

  const categoriesCount = await Promise.all(categoriesCountPromise);

  const inventory: Record<string, number>[] = [];
  categories.forEach((category, i) => {
    inventory.push({
      [category]: categoriesCount[i],
      [`${category}-percent`]: Math.round(
        (categoriesCount[i] / productsCount) * 100
      ),
    });
  });
  return inventory;
};

interface MyDocument {
  createdAt: Date;
  discount?: number;
  total?: number;
}
type FuncProps = {
  length: number;
  docArr: MyDocument[];
  today?: Date;
  property?: "discount" | "total";
};
export const getChartData = ({ length, docArr, property }: FuncProps) => {
  const today = new Date();
  const data: number[] = new Array(length).fill(0);

  docArr.forEach((i) => {
    const creationDate = i.createdAt;
    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
    if (monthDiff < length) {
      data[length - monthDiff - 1] += property ? i[property]! : 1;
      // if (property) {
      //     data[length - monthDiff - 1] += i.discount!
      // } else {
      //     data[length - monthDiff - 1] += 1

      // }
    }
  });
  return data;
};
