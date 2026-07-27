// Inventory/data/inventoryData.ts

import {
  categories as accessoryCategories,
  initialAccessories,
} from "@/screens/AccessoryDetails/accessoryData";

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
  { name: "All", count: initialAccessories.length, icon: "Folder" },
  ...accessoryCategories.map((category) => ({
    name: category,
    count: initialAccessories.filter((item) => item.subCategory === category)
      .length,
    icon: "Folder",
  })),
];

const inventoryImages: Record<string, string> = {
  "Logitech Blue Mouse":
    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=150&auto=format&fit=crop&q=60",
  "Dell KM117 Keyboard":
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150&auto=format&fit=crop&q=60",
  "HDMI Cable 1.5m":
    "https://images.unsplash.com/photo-1621993202323-f438eec934e2?w=150&auto=format&fit=crop&q=60",
  "LAN Cable Cat6":
    "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=150&auto=format&fit=crop&q=60",
  "Noise Cancelling Headset":
    "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=150&auto=format&fit=crop&q=60",
  "65W Laptop Adapter":
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=150&auto=format&fit=crop&q=60",
  "Logitech K120 Keyboard":
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=150&auto=format&fit=crop&q=60",
  "Generic Monitor Mount":
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=150&auto=format&fit=crop&q=60",
  "USB-C Multiport Hub":
    "https://images.unsplash.com/photo-1468495244123-6c6c332eeece?w=150&auto=format&fit=crop&q=60",
  "Wireless Presenter":
    "https://images.unsplash.com/photo-1609174008885-308d663caaac?w=150&auto=format&fit=crop&q=60",
  "Webcam 1080p":
    "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=150&auto=format&fit=crop&q=60",
  "USB Extension Cable":
    "https://images.unsplash.com/photo-1621993202323-f438eec934e2?w=150&auto=format&fit=crop&q=60",
};

export const dummyInventory: InventoryItem[] = Array.from(
  initialAccessories.reduce((items, accessory) => {
    const key = `${accessory.subCategory}:${accessory.itemName}`;
    const existingItem = items.get(key);

    if (existingItem) {
      existingItem.quantity += 1;
      return items;
    }

    items.set(key, {
      id: accessory.id,
      name: accessory.itemName,
      category: accessory.subCategory,
      image: inventoryImages[accessory.itemName] ?? "",
      quantity: 1,
    });

    return items;
  }, new Map<string, InventoryItem>()).values()
);
