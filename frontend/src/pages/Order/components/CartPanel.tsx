import { Button, Input, Stepper } from '../../../components/atoms';
import React, { useState } from 'react';
import { SvgIcon } from '../../../components/atoms/svg-sprite-loader';

import { CartItem } from '../../../types/models';

interface Props {
  unsentItems: CartItem[];
  sentKOTs: { kotNumber: number; items: CartItem[] }[];
  onUpdateQty: (id: number, delta: number) => void;
  onUpdateNote: (id: number, note: string) => void;
  onCancelItem: (orderItemId: number) => void;
  onSendKOT: (print: boolean) => void;
  onGenerateBill: () => void;
  onVoidOrder: () => void;
}

const CartPanel: React.FC<Props> = ({ unsentItems, sentKOTs, onUpdateQty, onUpdateNote, onCancelItem, onSendKOT, onGenerateBill, onVoidOrder }) => {
  const [expandedKOTs, setExpandedKOTs] = useState<number[]>([]);
  
  const toggleKOT = (num: number) => {
    setExpandedKOTs(prev => prev.includes(num) ? prev.filter(n => n !== num) : [...prev, num]);
  };

  const allSentItems = sentKOTs.flatMap(k => k.items);
  const subtotal = [...unsentItems, ...allSentItems].reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto space-y-4 pr-2">
        {/* Render Sent KOTs */}
        {sentKOTs.map(kot => (
          <div key={kot.kotNumber} className="border border-gray-200 rounded overflow-hidden">
            <button 
              className="w-full flex items-center justify-between p-3 bg-gray-100 hover:bg-gray-200 transition-colors"
              onClick={() => { toggleKOT(kot.kotNumber); }}
            >
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-700">KOT #{kot.kotNumber || '0'}</span>
                <span className="text-xs text-gray-500 font-medium">({kot.items.reduce((s, i) => s + i.qty, 0)} items)</span>
              </div>
              <SvgIcon name="chevron-down" className={`h-4 w-4 transition-transform ${expandedKOTs.includes(kot.kotNumber) ? 'rotate-180' : ''}`} />
            </button>
            {expandedKOTs.includes(kot.kotNumber) && (
              <div className="p-3 bg-white divide-y divide-gray-100">
                {kot.items.map(item => (
                  <div key={item.id} className="py-2 flex justify-between items-start first:pt-0 last:pb-0">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-800">{item.qty}x {item.name}</span>
                        {item.status && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded uppercase font-bold">{item.status}</span>}
                      </div>
                      {item.note && <p className="text-xs text-gray-500 mt-0.5">{item.note}</p>}
                    </div>
                    <div className="flex flex-col items-end pl-2">
                      <span className="text-sm font-bold text-gray-700">₹{(item.price * item.qty).toFixed(2)}</span>
                      {item.orderItemId !== undefined && (
                        <button 
                          onClick={() => { onCancelItem(item.orderItemId as number); }}
                          className="text-red-500 hover:text-red-700 text-xs mt-1 font-medium flex items-center gap-1"
                          title="Void item"
                        >
                          <SvgIcon name="trash" className="h-3 w-3" /> Void
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Render Unsent Items */}
        {unsentItems.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Unsent Items</h3>
            <div className="space-y-2">
              {unsentItems.map(item => (
                <div key={item.id} className="border border-blue-100 rounded p-3 bg-blue-50 relative">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-blue-900 pr-8">{item.name}</h4>
                    <p className="font-bold text-blue-900 shrink-0">₹{(item.price * item.qty).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center">
                      <Stepper 
                        value={item.qty} 
                        onChange={(newQty) => { onUpdateQty(item.id, newQty - item.qty); }} 
                        min={0} 
                      />
                    </div>
                    <div className="flex-1 ml-3">
                      <Input 
                        type="text" 
                        placeholder="Add note..." 
                        value={item.note}
                        onChange={(e) => { onUpdateNote(item.id, e.target.value); }}
                        className="bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {sentKOTs.length === 0 && unsentItems.length === 0 && (
          <div className="flex items-center justify-center h-full text-gray-400">
            Empty Order
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4 px-1">
          <span className="text-gray-600 font-medium">Total</span>
          <span className="text-xl font-bold">₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Button 
              variant="outline"
              block
              onClick={() => { onSendKOT(false); }}
              disabled={unsentItems.length === 0}
            >
              Save KOT
            </Button>
            <Button 
              variant="secondary"
              block
              onClick={() => { onSendKOT(true); }}
              disabled={unsentItems.length === 0}
            >
              Print KOT
            </Button>
          </div>
          <Button 
            variant="primary"
            block
            onClick={onGenerateBill}
            disabled={sentKOTs.length === 0}
          >
            Generate Bill
          </Button>
          <Button 
            variant="outline"
            block
            className="text-red-600 border-red-600 hover:bg-red-50"
            onClick={onVoidOrder}
            disabled={sentKOTs.length === 0 && unsentItems.length === 0}
          >
            Void Order
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartPanel;
