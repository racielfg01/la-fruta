import { Product } from "./store";

export const products: Product[] = [
  {
    id: "1",
    name: "Organic Apples",
    description:
      "Crisp and sweet organic apples freshly picked from local orchards. Perfect for snacking, baking, or making fresh juice.",
    price: 4.99,
    unit: "por lb",
    image: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=800&h=600&fit=crop",
    category: "Fruits",
    origin: "Washington Valley Farms",
    stock: 10,
    inStock: true,
    visible: true,
  },
  {
    id: "2",
    name: "Valencia Oranges",
    description:
      "Juicy Valencia oranges bursting with vitamin C. Ideal for fresh-squeezed juice or eating out of hand.",
    price: 5.49,
    unit: "por lb",
    image: "https://images.unsplash.com/photo-1547514701-42782101795e?w=800&h=600&fit=crop",
    category: "Citrus",
    origin: "California Sun Orchards",
    stock: 10,
    inStock: true,
    visible: true,
  },
  {
    id: "3",
    name: "Fresh Strawberries",
    description:
      "Sweet, red strawberries picked at peak ripeness. Perfect for desserts, smoothies, or eating fresh.",
    price: 6.99,
    unit: "por pinta",
    image: "https://images.unsplash.com/photo-1464965911861-746a04b4bca6?w=800&h=600&fit=crop",
    category: "Berries",
    origin: "Green Valley Farms",
    stock: 10,
    inStock: true,
    visible: true,
  },
  {
    id: "4",
    name: "Ripe Bananas",
    description:
      "Perfectly ripe bananas, naturally sweet and full of potassium. Great for smoothies, baking, or as a healthy snack.",
    price: 2.49,
    unit: "c/u",
    image: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=800&h=600&fit=crop",
    category: "Tropical",
    origin: "Costa Rica Plantations",
    stock: 10,
    inStock: true,
    visible: true,
  },
  {
    id: "5",
    name: "Organic Blueberries",
    description:
      "Plump, organic blueberries packed with antioxidants. Perfect for breakfast, baking, or snacking.",
    price: 7.99,
    unit: "por pinta",
    image: "https://images.unsplash.com/photo-1498557850523-fd3d118b962e?w=800&h=600&fit=crop",
    category: "Berries",
    origin: "Maine Berry Farms",
    stock: 10,
    inStock: true,
    visible: true,
  },
  {
    id: "6",
    name: "Fresh Mangoes",
    description:
      "Tropical mangoes with buttery, sweet flesh. Excellent for smoothies, salsas, or enjoying fresh.",
    price: 3.99,
    unit: "c/u",
    image: "https://images.unsplash.com/photo-1553279768-865429fa0078?w=800&h=600&fit=crop",
    category: "Tropical",
    origin: "Mexican Tropical Farms",
    stock: 10,
    inStock: true,
    visible: true,
  },
  {
    id: "7",
    name: "Red Grapes",
    description:
      "Seedless red grapes, crisp and naturally sweet. Perfect for snacking, salads, or cheese boards.",
    price: 4.49,
    unit: "por lb",
    image: "https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=800&h=600&fit=crop",
    category: "Fruits",
    origin: "Napa Valley Vineyards",
    stock: 10,
    inStock: true,
    visible: true,
  },
  {
    id: "8",
    name: "Ripe Avocados",
    description:
      "Creamy Hass avocados, perfectly ripe and ready to eat. Ideal for guacamole, toast, or salads.",
    price: 2.99,
    unit: "c/u",
    image: "https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?w=800&h=600&fit=crop",
    category: "Fruits",
    origin: "California Avocado Farms",
    stock: 10,
    inStock: true,
    visible: true,
  },
  {
    id: "9",
    name: "Fresh Lemons",
    description:
      "Bright, tangy lemons perfect for cooking, baking, or making refreshing lemonade.",
    price: 3.49,
    unit: "por lb",
    image: "https://images.unsplash.com/photo-1590502593747-42a996133562?w=800&h=600&fit=crop",
    category: "Citrus",
    origin: "Mediterranean Citrus Co.",
    stock: 10,
    inStock: true,
    visible: true,
  },
  {
    id: "10",
    name: "Sweet Watermelon",
    description:
      "Refreshing seedless watermelon, perfectly sweet and hydrating. A summer favorite for picnics and gatherings.",
    price: 8.99,
    unit: "c/u",
    image: "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&h=600&fit=crop",
    category: "Melons",
    origin: "Georgia Melon Farms",
    stock: 10,
    inStock: true,
    visible: true,
  },
  {
    id: "11",
    name: "Fresh Raspberries",
    description:
      "Delicate, sweet raspberries with a perfect balance of tartness. Great for desserts and breakfast.",
    price: 8.49,
    unit: "por pinta",
    image: "https://images.unsplash.com/photo-1577003833619-76bbd7f82948?w=800&h=600&fit=crop",
    category: "Berries",
    origin: "Pacific Northwest Farms",
    stock: 0,
    inStock: false,
    visible: true,
  },
  {
    id: "12",
    name: "Organic Pears",
    description:
      "Sweet, juicy organic pears with a buttery texture. Perfect for snacking or adding to salads.",
    price: 4.79,
    unit: "por lb",
    image: "https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?w=800&h=600&fit=crop",
    category: "Fruits",
    origin: "Oregon Orchard Co.",
    stock: 10,
    inStock: true,
    visible: true,
  },
];

export const categories = [...new Set(products.map((p) => p.category))];

export function getProductById(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(category: string): Product[] {
  return products.filter((p) => p.category === category);
}
