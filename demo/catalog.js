export const PRODUCTS = [
  { id: "p1", name: "Oak desk", category: "furniture", price: 240 },
  { id: "p2", name: "Desk lamp", category: "lighting", price: 48 },
  { id: "p3", name: "Wool throw", category: "textiles", price: 36 },
  { id: "p4", name: "Walnut chair", category: "furniture", price: 180 },
  { id: "p5", name: "Paper shade", category: "lighting", price: 64 },
];

export function uniqueCategories(products) {
  return [...new Set(products.map((item) => item.category))].sort();
}

export function filterProducts(products, category) {
  if (!category || category === "all") {
    return products.slice();
  }
  return products.filter((item) => item.category === category);
}
