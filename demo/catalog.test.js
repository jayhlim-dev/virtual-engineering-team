import assert from "node:assert/strict";
import test from "node:test";
import { PRODUCTS, filterProducts, uniqueCategories } from "./catalog.js";

test("all returns every product", () => {
  assert.equal(filterProducts(PRODUCTS, "all").length, PRODUCTS.length);
  assert.equal(filterProducts(PRODUCTS, "").length, PRODUCTS.length);
});

test("category filter returns only that category", () => {
  const lighting = filterProducts(PRODUCTS, "lighting");
  assert.ok(lighting.length > 0);
  assert.ok(lighting.every((item) => item.category === "lighting"));
});

test("unknown category is empty", () => {
  assert.deepEqual(filterProducts(PRODUCTS, "robots"), []);
});

test("categories are unique and sorted", () => {
  assert.deepEqual(uniqueCategories(PRODUCTS), ["furniture", "lighting", "textiles"]);
});
