export const getCategoryName = (product) => {
  if (!product?.category) return "No Category";

  if (typeof product.category === "string") {
    return product.category;
  }

  return product.category?.name || "No Category";
};
