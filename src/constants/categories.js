export const SERVICES = [
  "PLUMBING",
  "GARDENING",
  "REPAIRS",
  "CLEANING AND CAR WASH",
  "ELECTRICIANS",
  "BEAUTY",
  "CATERING",
  "GRAPHIC DESIGN",
  "BAKING",
  "PHOTOGRAPHY",
  "TUTOR",
  "CONSTRUCTION",
  "ACCOUNTANTS",
  "EVENT ORGANISERS",
  "TRANSPORTATION",
  "OTHER",
];

export const PRODUCTS = [
  "FOOD",
  "HEALTH AND BEAUTY",
  "FURNITURE",
  "HOME, KITCHEN, GARDENING",
  "SOAPS AND CLEANING DETERGENTS",
  "APPLIANCES",
  "BABIES, KIDS AND TODDLERS",
  "STATIONERY AND OFFICE SUPPLY",
  "ELECTRONICS",
  "CLOTHING AND SHOES",
  "ACCESSORIES",
  "BOOKS",
  "PETS",
  "OTHER",
];

export const OTHER_CATEGORY = "OTHER";

export const toOptions = (arr) => arr.map((v) => ({ value: v, label: v }));

export function getCategoriesForType(type) {
  return type === "SERVICES" ? SERVICES : PRODUCTS;
}

/** Map a stored category into select + optional custom text for the form. */
export function resolveCategoryFormValues(category, type = "PRODUCTS") {
  const raw = String(category || "").trim();
  const list = getCategoriesForType(type);

  if (!raw) {
    return { category: "", customCategory: "" };
  }

  if (list.includes(raw)) {
    return {
      category: raw,
      customCategory: "",
    };
  }

  return {
    category: OTHER_CATEGORY,
    customCategory: raw,
  };
}

/** Resolve the category value to persist when submitting. */
export function resolveCategoryForSubmit(category, customCategory) {
  if (String(category || "").trim().toUpperCase() === OTHER_CATEGORY) {
    return String(customCategory || "").trim();
  }
  return String(category || "").trim();
}

export default {
  SERVICES,
  PRODUCTS,
  OTHER_CATEGORY,
  toOptions,
  getCategoriesForType,
  resolveCategoryFormValues,
  resolveCategoryForSubmit,
};
