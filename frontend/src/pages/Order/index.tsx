import { Button } from '../../components/atoms';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MenuPanel from './components/MenuPanel';
import CartPanel from './components/CartPanel';
import { CartItem, MenuItem } from '../../types/models';
import BillModal from './components/BillModal';
import CancelOrderModal from './components/CancelOrderModal';
import { api } from '../../lib/ipc';
import { useModal } from '../../hooks/useModal';

const OrderPage: React.FC = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const { showModal, hideModal } = useModal();

  useEffect(() => {
    let active = true;
    if (tableId) {
      api.orders.getByTable({ tableId: Number(tableId) })
        .then(res => {
          if (active && res.success && res.data) {
            const items: CartItem[] = res.data.items.map(i => ({
              id: i.menu_item_id,
              name: i.name,
              price: i.unit_price,
              qty: i.qty,
              note: i.note ?? ''
            }));
            setCart(items);
          }
        })
        .catch((err: unknown) => {
          console.error(err);
        });
    }
    return () => { active = false; };
  }, [tableId]);

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
    if (cart.length === 0 || !tableId) { return; }
    
    const res = await api.orders.sendKOT({ 
      tableId: Number(tableId), 
      items: cart 
    });
    if (res.success) {
      await api.print.kot({ items: cart, tableName: `Table ${tableId}`, orderNote: '' });
      navigate('/tables');
    }
  };

  const handleCancelOrder = async (note: string) => {
    if (!tableId) {
      return;
    }
    const res = await api.orders.cancelByTable({ tableId: Number(tableId), note });
    if (res.success) {
      setCart([]);
      hideModal();
      navigate('/tables');
    } else {
      console.error('Failed to cancel order:', res.error);
    }
  };

  return (
    <div className="flex h-full bg-white relative">
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

      <div className="w-96 bg-white p-6 pt-6 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">Table {tableId}</span>
        </div>
        <CartPanel 
          cart={cart}
          onUpdateQty={handleUpdateQty}
          onUpdateNote={handleUpdateNote}
          onSendKOT={() => { void handleSendKOT(); }}
          onGenerateBill={() => { 
            showModal({
              title: "Generate Final Bill",
              content: <BillModal orderId={parseInt(tableId ?? '0')} cart={cart} onClose={hideModal} />,
              size: "xl",
              actions: (
                <>
                  <Button variant="outline" onClick={hideModal}>Cancel</Button>
                  <Button type="submit" form="bill-form" variant="primary">Confirm & Print</Button>
                </>
              )
            });
          }}
          onVoidOrder={() => { 
            showModal({
              title: "Void Order",
              content: <CancelOrderModal onConfirm={(note) => { void handleCancelOrder(note); }} />,
              actions: (
                <>
                  <Button variant="outline" onClick={hideModal}>Go Back</Button>
                  <Button type="submit" form="cancel-order-form" variant="danger">Confirm Void Order</Button>
                </>
              )
            });
          }}
        />
      </div>
    </div>
  );
};

export default OrderPage;
