import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

const storageKey = '@GoMarketPlace';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): Promise<void>;
  increment(id: string): Promise<void>;
  decrement(id: string): Promise<void>;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storageProducts = await AsyncStorage.getItem(storageKey);

      if (storageProducts) {
        setProducts([...JSON.parse(storageProducts)]);
      }
    }

    loadProducts();
  }, []);

  const saveProjects = useCallback(async (): Promise<void> => {
    await AsyncStorage.setItem(storageKey, JSON.stringify(products));
  }, [products]);

  const addToCart = useCallback(
    async product => {
      const productExistsIndex = products.findIndex(
        item => item.id === product.id,
      );

      if (productExistsIndex > -1) {
        const allProducts = [...products];
        allProducts[productExistsIndex].quantity += 1;

        setProducts([...allProducts]);
        await saveProjects();
        return;
      }
      setProducts([...products, { ...product, quantity: 1 }]);
      await saveProjects();
    },
    [products, saveProjects],
  );

  const increment = useCallback(
    async id => {
      const index = products.findIndex(item => item.id === id);

      const allProducts = [...products];

      allProducts[index].quantity += 1;

      setProducts([...allProducts]);
      await saveProjects();
    },
    [products, saveProjects],
  );

  const decrement = useCallback(
    async id => {
      const index = products.findIndex(item => item.id === id);

      if (index > -1) {
        const allProducts = [...products];
        allProducts[index].quantity -= 1;
        setProducts([...allProducts]);
      }

      if (products[index].quantity === 0) {
        setProducts(products.filter(item => item.id !== id));
      }
      await saveProjects();
    },
    [products, saveProjects],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
