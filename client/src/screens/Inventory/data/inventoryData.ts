// Inventory/data/inventoryData.ts

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  image: string; // Dynamic Image URL path 
  quantity: number;
}

export interface Category {
  name: string;
  count: number;
  icon: string;
}

export const dummyCategories: Category[] = [
  { name: "All", count: 12, icon: "Folder" },
  { name: "Laptops & Computers", count: 4, icon: "Laptop" },
  { name: "Electronics", count: 4, icon: "Zap" },
  { name: "Furniture", count: 2, icon: "Armchair" },
  { name: "Cleaning Tools", count: 2, icon: "Wrench" },
];

export const dummyInventory: InventoryItem[] = [
  // --- Laptops & Computers ---
  { 
    id: "001", 
    name: "MacBook Pro M3", 
    category: "Laptops & Computers", 
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=150&auto=format&fit=crop&q=60", 
    quantity: 3 
  },
  { 
    id: "002", 
    name: "Dell Latitude 5420", 
    category: "Laptops & Computers", 
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=150&auto=format&fit=crop&q=60", 
    quantity: 15 
  },
  { 
    id: "003", 
    name: "HP EliteBook 840", 
    category: "Laptops & Computers", 
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?w=150&auto=format&fit=crop&q=60", 
    quantity: 0 
  },
  { 
    id: "004", 
    name: "Lenovo ThinkPad X1 Carbon", 
    category: "Laptops & Computers", 
    image: "https://images.unsplash.com/photo-1618424181497-157f25b6ddd5?w=150&auto=format&fit=crop&q=60", 
    quantity: 7 
  },

  // --- Electronics ---
  { 
    id: "005", 
    name: "Logitech MX Master 3S", 
    category: "Electronics", 
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=150&auto=format&fit=crop&q=60", 
    quantity: 22 
  },
  { 
    id: "006", 
    name: "Dell 27\" 4K Monitor", 
    category: "Electronics", 
    image: "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150&auto=format&fit=crop&q=60", 
    quantity: 5 
  },
  { 
    id: "007", 
    name: "Sony WH-1000XM5 Headphones", 
    category: "Electronics", 
    image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=150&auto=format&fit=crop&q=60", 
    quantity: 12 
  },
  { 
    id: "008", 
    name: "Anker USB-C Multi-Port Hub", 
    category: "Electronics", 
    image: "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=150&auto=format&fit=crop&q=60", 
    quantity: 40 
  },

  // --- Furniture ---
  { 
    id: "009", 
    name: "Ergonomic Office Chair", 
    category: "Furniture", 
    image: "https://images.unsplash.com/photo-1505797149-43b0069ec26b?w=150&auto=format&fit=crop&q=60", 
    quantity: 8 
  },
  { 
    id: "010", 
    name: "Adjustable Standing Desk", 
    category: "Furniture", 
    image: "https://images.unsplash.com/photo-1595515106969-1ce29566ff1c?w=150&auto=format&fit=crop&q=60", 
    quantity: 4 
  },

  // --- Cleaning Tools ---
  { 
    id: "011", 
    name: "Dyson V15 Vacuum Cleaner", 
    category: "Cleaning Tools", 
    image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=150&auto=format&fit=crop&q=60", 
    quantity: 2 
  },
  { 
    id: "012", 
    name: "Microfiber Cleaning Cloths (10pk)", 
    category: "Cleaning Tools", 
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=150&auto=format&fit=crop&q=60", 
    quantity: 50 
  }
];