import { PRODUCTS, filterProducts, uniqueCategories } from "./catalog.js";

const list = document.querySelector("#product-list");
const empty = document.querySelector("#empty-state");
const filter = document.querySelector("#category-filter");
const status = document.querySelector("#result-count");

function render(products) {
  list.innerHTML = "";
  if (products.length === 0) {
    empty.hidden = false;
    status.textContent = "0 products";
    return;
  }
  empty.hidden = true;
  status.textContent = `${products.length} product${products.length === 1 ? "" : "s"}`;
  for (const product of products) {
    const item = document.createElement("li");
    item.className = "product";
    item.innerHTML = `<h2>${product.name}</h2><p>${product.category}</p><p>$${product.price}</p>`;
    list.appendChild(item);
  }
}

function fillFilter() {
  for (const category of uniqueCategories(PRODUCTS)) {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    filter.appendChild(option);
  }
}

filter.addEventListener("change", () => {
  render(filterProducts(PRODUCTS, filter.value));
});

fillFilter();
render(PRODUCTS);
