import { Button, Input, Stepper } from '../../../components/atoms';
import React from 'react';

import { CartItem } from '../../../types/models';

interface Props {
  cart: CartItem[];
  onUpdateQty: (id: number, delta: number) => void;
  onUpdateNote: (id: number, note: string) => void;
  onSendKOT: () => void;
  onGenerateBill: () => void;
  onVoidOrder: () => void;
}

const CartPanel: React.FC<Props> = ({ cart, onUpdateQty, onUpdateNote, onSendKOT, onGenerateBill, onVoidOrder }) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-4 pr-2">
        {cart.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            Empty Order
          </div>
        ) : (
          cart.map(item => (
            <div key={item.id} className="border rounded p-3 bg-gray-50 relative">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium pr-8">{item.name}</h4>
                <p className="font-bold text-gray-700">₹{(item.price * item.qty).toFixed(2)}</p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center">
                  <Stepper 
                    value={item.qty} 
                    onChange={(newQty) => { onUpdateQty(item.id, newQty - item.qty); }} 
                    min={1} 
                  />
                </div>
                <div className="flex-1 ml-3">
                  <Input 
                    type="text" 
                    placeholder="Add note..." 
                    value={item.note}
                    onChange={(e) => { onUpdateNote(item.id, e.target.value); }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-gray-600 font-medium">Subtotal</span>
          <span className="text-xl font-bold">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="space-y-3">
          <Button 
            variant="secondary"
            className="w-full py-3"
            onClick={onSendKOT}
            disabled={cart.length === 0}
          >
            Print KOT
          </Button>
          <Button 
            variant="primary"
            className="w-full py-3"
            onClick={onGenerateBill}
            disabled={cart.length === 0}
          >
            Generate Bill
          </Button>
          <Button 
            variant="outline"
            className="w-full py-3 text-red-600 border-red-600 hover:bg-red-50"
            onClick={onVoidOrder}
            disabled={cart.length === 0}
          >
            Void Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPanel;
