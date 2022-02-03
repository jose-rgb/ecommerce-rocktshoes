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
          localStorage.setItem('@RocketShoes:cart', JSON.stringify([...cart, {...product, amount: 1}]));
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
      //verificar se produto existe no carrinho 
      const productExists = cart.some(cartProduct => cartProduct.id === productId);

      //se n existir
      if(!productExists) {
        toast.error('Erro na remoção do produto');
        return;
      }

      //se existir, retornar todos os products que tem id diferente do id repassado para remover
      const updatedCart = cart.filter(cartItem => cartItem.id !== productId);
      setCart(updatedCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart));

    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount < 1) {
        toast.error('Erro na alteração de quantidade do produto')
        return;
      }

       //buscar produto no stock por id
       const response = await api.get(`/stock/${productId}`);
       const productAmount = response.data.amount;
       //se n tem em estoque a quantidade solicitada
       const stockIsNotAvailable = amount > productAmount;

       if(stockIsNotAvailable) {
         toast.error('Quantidade solicitada fora do estoque');
         return;
       }

       //se existe
       const productExists = cart.some(cartProduct => cartProduct.id === productId);

       //se n existir
       if(!productExists) {
         toast.error('Erro na alteração de quantidade do produto');
         return;
       }

       //repassando o novo amount, se id n for igual devolver o cartItem sem alteração
       const updateCart = cart.map(cartItem => cartItem.id === productId ? {
         ...cartItem,
         amount: amount,
       }: cartItem)

       //salvando cart
       setCart(updateCart);
       //salvando no localstorage
       localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart));
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
