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
    //Buscar dados do localStorage
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    //se existir usar storageCart
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    //se não retornar vazio
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      //Verificar se existe no carrinho um produto igual productId
      const productAlreadyInCard = cart.find(product => product.id === productId);

      //se n estiver no carrinho, adicionar
      if(!productAlreadyInCard) {
        //buscar produto pelo id
        const {data:product} = await api.get<Product>(`products/${productId}`);
        //buscar produto no estoque
        const {data:stock} = await api.get<Stock>(`stock/${productId}`);

        //verificar se tem no estoque
        if(stock.amount > 0) {
          //adicionar os que ja tinham mais o novo desestruturado
          setCart([...cart, {...product, amount: 1}]);
          //adicionar no localstorage
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...product}]));
          toast('Produto adicionado')
          return;
        }
      }

      // se estiver, incrementar 1 unidade
      if(productAlreadyInCard) {
        //buscar produto no estoque
        const {data:stock} = await api.get<Stock>(`stock/${productId}`);

        if(stock.amount > productAlreadyInCard.amount) {
          //verificar o id, se for somar +1
          const updateCart = cart.map(cartItem => cartItem.id === productId ? {
            ...cartItem,
            amount: Number(cartItem.amount) + 1
          } : cartItem);

          setCart(updateCart);
          localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
          toast('Produto adicionado')
          return;
        } else {
          toast.error('Quantidade solicitada está fora de estoque');
        }
      }

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // TODO
    } catch {
      // TODO
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      // TODO
    } catch {
      // TODO
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
