export const getSupplierName = (product, suppliers = []) => {
  if (!product?.supplier) {
    return "No Supplier";
  }

  // OLD plain string suppliers
  if (typeof product.supplier === "string") {
    // If ObjectId-like string
    if (/^[0-9a-fA-F]{24}$/.test(product.supplier)) {
      const matchedSupplier = suppliers.find(
        (s) => s._id === product.supplier
      );

      return matchedSupplier?.name || "No Supplier";
    }

    return product.supplier;
  }

  // populated supplier object
  if (typeof product.supplier === "object") {
    return product.supplier?.name || "No Supplier";
  }

  return "No Supplier";
};
