import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MenuPanel from './components/MenuPanel';
import CartPanel from './components/CartPanel';
import { CartItem, MenuItem } from '../../types/models';
import Button from '../../components/atoms/button/button';
import BillModal from './components/BillModal';
import { api } from '../../lib/ipc';

const OrderPage: React.FC = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showBillModal, setShowBillModal] = useState(false);

  const handleAddItem = (menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === menuItem.id);
      if (existing) {
        return prev.map(item => 
          item.id === menuItem.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { 
        id: menuItem.id, 
        name: menuItem.name, 
        price: menuItem.price, 
        qty: 1, 
        note: '' 
      }];
    });
  };

  const handleUpdateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const handleUpdateNote = (id: number, note: string) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, note } : item
    ));
  };

  const handleSendKOT = async () => {
    if (cart.length === 0) {return;}
    
    // Simulate updating DB to create/update order and print KOT
    const res = await api.print.kot({ items: cart, tableName: `Table ${tableId}`, orderNote: '' });
    if (res.success) {
      // Alert removed for lint compliance
    }
  };

  return (
    <div className="flex h-screen bg-white">
      {/* Header/Back Button */}
      <div className="absolute top-0 left-0 p-4 z-10">
        <Button variant="link" onClick={() => { navigate('/tables'); }}>
          ← Back to Tables
        </Button>
      </div>

      <div className="flex-1 p-6 pt-20 border-r bg-gray-50 overflow-hidden">
        <h1 className="text-2xl font-bold mb-4">Menu</h1>
        <MenuPanel onAddItem={handleAddItem} />
      </div>

      <div className="w-96 bg-white p-6 pt-20 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">Table {tableId}</span>
        </div>
        <CartPanel 
          cart={cart}
          onUpdateQty={handleUpdateQty}
          onUpdateNote={handleUpdateNote}
          onSendKOT={() => { void handleSendKOT(); }}
          onGenerateBill={() => { setShowBillModal(true); }}
        />
      </div>

      {showBillModal && (
        <BillModal 
          orderId={parseInt(tableId ?? '0')} 
          cart={cart}
          onClose={() => { setShowBillModal(false); }} 
        />
      )}
    </div>
  );
};

export default OrderPage;
