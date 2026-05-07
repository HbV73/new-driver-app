import { Minus, Plus, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Product } from '@/types';

interface ProductRowProps {
  product: Product;
  onQtyChange?: (qty: number) => void;
}

const ProductRow = ({ product, onQtyChange }: ProductRowProps) => {
  const [qty, setQty] = useState(0);

  const updateQty = (newQty: number) => {
    setQty(newQty);
    onQtyChange?.(newQty);
  };

  return (
    <div className="bg-card rounded-lg border border-border p-3 flex items-center justify-between animate-slide-up">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-semibold text-foreground truncate">{product.name}</h4>
          <button className="text-muted-foreground hover:text-foreground">
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {product.oldPrice && (
            <span className="text-xs text-muted-foreground line-through">{product.oldPrice.toFixed(2)}€</span>
          )}
          <span className="text-sm font-bold text-foreground">{product.price.toFixed(2)}€</span>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-3">
        <button
          onClick={() => updateQty(Math.max(0, qty - 1))}
          className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-sm font-bold w-6 text-center">{qty}</span>
        <button
          onClick={() => updateQty(qty + 1)}
          className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ProductRow;
