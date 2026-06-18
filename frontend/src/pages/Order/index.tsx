import { Button, Select, BackButton } from '../../components/atoms';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MenuPanel from './components/MenuPanel';
import CartPanel from './components/CartPanel';
import { CartItem, MenuItem, Customer, Menu } from '../../types/models';
import BillModal, { BillModalHandle } from './components/BillModal';
import CancelOrderModal from './components/CancelOrderModal';
import { api } from '../../lib/ipc';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';
import { CustomerSelect } from '../../components/organisms/CustomerSelect';
import { useAuthStore } from '../../store/auth';
import { SvgIcon } from '../../components/atoms/svg-sprite-loader';

const OrderPage: React.FC = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const staff = useAuthStore(s => s.staff);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>(Number(tableId) === 0 ? 'takeaway' : 'dine-in');
  const [occupiedTime, setOccupiedTime] = useState<string>('');
  const { showModal, hideModal } = useModal();
  const { showToast } = useToast();
  const billModalRef = useRef<BillModalHandle>(null);

  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    api.menu.getMenus().then(res => {
      if (active && res.success && res.data) {
        const activeMenus = res.data.filter(m => m.is_active === 1);
        setMenus(activeMenus);
        if (activeMenus.length > 0) {
          const defaultMenu = activeMenus.find(m => m.is_default);
          setActiveMenuId(defaultMenu?.id ?? activeMenus[0].id);
        }
      }
    }).catch(console.error);
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    if (tableId) {
      api.orders.getByTable({ tableId: Number(tableId) })
        .then(res => {
          if (active && res.success && res.data) {
            const orderData = res.data;
            setOrderId(orderData.id);
            setCreatedAt(orderData.created_at);
            setOrderType(orderData.type);
            if (orderData.customer_id) {
              api.customers.getById(orderData.customer_id).then(custRes => {
                if (active && custRes.success && custRes.data) {
                  setCustomer(custRes.data);
                } else if (active) {
                  setCustomer({
                    id: orderData.customer_id as number,
                    name: orderData.customer_name ?? 'Unknown',
                    phone: null, email: null, loyalty_points: 0, total_visits: 0,
                    credit_limit: 0, outstanding_balance: 0, created_at: '',
                  });
                }
              }).catch(console.error);
            }
            const items: CartItem[] = orderData.items.map(i => ({
              id: i.menu_item_id,
              name: i.name,
              price: i.unit_price,
              qty: i.qty,
              note: i.note ?? '',
              status: i.preparation_status ?? 'sent',
              originalQty: i.qty,
            }));
            setCart(items);
          }
        })
        .catch((err: unknown) => { console.error(err); });
    }
    return () => { active = false; };
  }, [tableId]);

  useEffect(() => {
    if (!createdAt) {
      const timer = setTimeout(() => { setOccupiedTime(''); }, 0);
      return () => { clearTimeout(timer); };
    }
    const updateTime = () => {
      const dateStr = createdAt.endsWith('Z') ? createdAt : `${createdAt.replace(' ', 'T')  }Z`;
      const ms = Math.max(0, Date.now() - new Date(dateStr).getTime());
      const mins = Math.floor(ms / 60000);
      const hrs = Math.floor(mins / 60);
      setOccupiedTime(`${hrs.toString().padStart(2, '0')}:${(mins % 60).toString().padStart(2, '0')}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => { clearInterval(timer); };
  }, [createdAt]);

  const handleCustomerSelect = async (selected: Customer | null) => {
    setCustomer(selected);
    if (!selected) {
      return;
    }

    if (orderId) {
      await api.orders.updateCustomer({ orderId, customerId: selected.id });
    } else if (tableId) {
      const res = await api.orders.create({
        tableId: Number(tableId),
        staffId: staff?.id,
        customerId: selected.id,
        type: orderType,
      });
      if (res.success && res.data) {
        setOrderId(res.data);
        setCreatedAt(new Date().toISOString());
        showToast({ message: `Table reserved for ${selected.name}`, variant: 'success' });
      }
    }
  };

  const handleAddItem = (menuItem: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === menuItem.id);
      if (existing) {
        return prev.map(item => item.id === menuItem.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id: menuItem.id, name: menuItem.name, price: menuItem.price, qty: 1, note: '' }];
    });
  };

  const handleUpdateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0));
  };

  const handleUpdateNote = (id: number, note: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, note } : item));
  };

  const handleSendKOT = async (shouldPrint: boolean) => {
    if ((cart.length === 0 && !orderId) || !tableId) {
      return;
    }

    const res = await api.orders.sendKOT({
      tableId: Number(tableId),
      items: cart,
      staffId: staff?.id,
      customerId: customer?.id,
      type: orderType,
    });
    if (res.success && res.data) {
      if (shouldPrint) {
        if (res.data.itemsToPrint.length > 0) {
          api.print.kot({ items: res.data.itemsToPrint, tableName: `Table ${tableId}`, orderNote: '' }).catch(console.error);
        } else {
          showToast({ message: 'No new items to print.', variant: 'warning' });
        }
      } else {
        showToast({ message: 'Order saved successfully.', variant: 'success' });
      }
      navigate('/tables');
    }
  };

  const handleCancelOrder = async (note: string) => {
    if (!tableId) {
      return;
    }
    if (!orderId) {
      setCart([]);
      hideModal();
      navigate('/tables');
      return;
    }
    try {
      const res = await api.orders.cancelOrder({ orderId, note });
      if (res.success) {
        setCart([]);
        hideModal();
        navigate('/tables');
      } else {
        showToast({ message: `Failed to cancel order: ${res.error}`, variant: 'error' });
      }
    } catch (e: unknown) {
      showToast({ message: `An unexpected error occurred: ${e instanceof Error ? e.message : String(e)}`, variant: 'error' });
    }
  };

  return (
    <div className="flex h-full bg-white relative">
      <div className="absolute top-0 left-0 p-4 z-10">
        <BackButton to="/tables" label="Back to Tables" />
      </div>

      <div className="flex-1 p-6 pt-14 border-r bg-gray-50 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Menu</h1>
          {menus.length > 1 && (
            <div className="w-48">
              <Select
                value={String(activeMenuId ?? '')}
                onChange={(e) => { setActiveMenuId(Number(e.target.value)); }}
              >
                {menus.map(m => (
                  <option key={m.id} value={String(m.id)}>{m.name}</option>
                ))}
              </Select>
            </div>
          )}
        </div>
        <MenuPanel menuId={activeMenuId} onAddItem={handleAddItem} />
      </div>

      <div className="w-96 bg-white p-6 pt-6 flex flex-col shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.05)] z-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-gray-800">Current Order</h2>
            {occupiedTime && (
              <div className="flex items-center gap-1 text-xs font-medium text-gray-500">
                <SvgIcon name="clock" className="h-3.5 w-3.5" aria-hidden={true} />
                <span>Occupied: {occupiedTime}</span>
              </div>
            )}
          </div>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
            {Number(tableId) === 0 ? (
              <select 
                value={orderType} 
                onChange={e => { setOrderType(e.target.value as 'dine-in' | 'takeaway' | 'delivery'); }}
                className="bg-transparent text-blue-800 font-bold focus:outline-none"
              >
                <option value="takeaway">Takeaway</option>
                <option value="delivery">Delivery</option>
              </select>
            ) : (
              `Table ${tableId}`
            )}
          </span>
        </div>

        <div className="mb-4">
          <CustomerSelect
            selectedCustomer={customer}
            onSelect={(c) => { void handleCustomerSelect(c); }}
            placeholder="Assign Customer (Optional)"
          />
        </div>

        <CartPanel
          cart={cart}
          onUpdateQty={handleUpdateQty}
          onUpdateNote={handleUpdateNote}
          onSendKOT={(print) => { void handleSendKOT(print); }}
          onGenerateBill={() => {
            if (!orderId) {
              showToast({ message: 'Order has not been sent to kitchen yet!', variant: 'warning' });
              return;
            }
            showModal({
              title: 'Generate Final Bill',
              content: <BillModal ref={billModalRef} orderId={orderId} cart={cart} initialCustomer={customer} onClose={hideModal} />,
              size: 'xl',
              actions: (
                <>
                  <Button variant="outline" onClick={hideModal}>Cancel</Button>
                  <Button type="button" variant="secondary" onClick={() => { billModalRef.current?.save(); }}>Complete & Save</Button>
                  <Button type="button" variant="primary" onClick={() => { billModalRef.current?.print(); }}>Print Receipt</Button>
                </>
              ),
            });
          }}
          onVoidOrder={() => {
            showModal({
              title: 'Void Order',
              content: <CancelOrderModal onConfirm={(note) => { void handleCancelOrder(note); }} />,
              actions: (
                <>
                  <Button variant="outline" onClick={hideModal}>Go Back</Button>
                  <Button type="submit" form="cancel-order-form" variant="danger">Confirm Void Order</Button>
                </>
              ),
            });
          }}
        />
      </div>
    </div>
  );
};

export default OrderPage;
