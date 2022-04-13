import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      console.log(storagedCart)
      return JSON.parse(storagedCart);
    }

    console.log('vazio')
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const newCarts = [...cart];
      const stock = await api.get(`/stock/${productId}`)
      const cartEdit = newCarts.find(product => product.id === productId);
      
      const stockAmount = stock.data.amount;
      
      if(cartEdit) {
        const totalAmount = cartEdit.amount + 1         

        if(totalAmount > stockAmount) {
          toast.error('Quantidade solicitada fora de estoque')
          return
        }
        else{
          cartEdit.amount = totalAmount;
          setCart([...newCarts]);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCarts));
        }
      }
      else {
        
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }

        setCart([...newCarts, newProduct]);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify([...newCarts, newProduct]));
        
      }
      
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const newCarts = [...cart];
      const cartEdit = newCarts.findIndex(product => product.id === productId);

      if(cartEdit >= 0){
        const cartRevoved = newCarts.filter(product => product.id !== productId);
        setCart(cartRevoved);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(cartRevoved));
      }
      else {
        throw Error()
      }

    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0){
        return
      }
      
      const newCarts = [...cart];
      const cartEdit = newCarts.find(product => product.id === productId);
      const stock = await api.get(`/stock/${productId}`)
      const stockAmount = stock.data.amount;

      if(cartEdit){
        if(amount > stockAmount) {
          toast.error('Quantidade solicitada fora de estoque');
          return;
        }
        cartEdit.amount = amount;
        setCart(newCarts);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCarts));
      }
      else{
        throw Error()
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
