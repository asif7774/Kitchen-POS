import { Button, Select, BackButton } from '../../components/atoms';
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MenuPanel from './components/MenuPanel';
import CartPanel from './components/CartPanel';
import { CartItem, MenuItem, Customer, Menu, OrderItem } from '../../types/models';
import BillModal, { BillModalHandle } from './components/BillModal';
import CancelOrderModal from './components/CancelOrderModal';
import { api } from '../../lib/ipc';
import { useModal } from '../../hooks/useModal';
import { useToast } from '../../hooks/useToast';
import { CustomerSelect } from '../../components/organisms/CustomerSelect';
import { useAuthStore } from '../../store/auth';
import { useBusinessSession } from '../../contexts/BusinessSessionContext';
import { SvgIcon } from '../../components/atoms/svg-sprite-loader';

const OrderPage: React.FC = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  const staff = useAuthStore(s => s.staff);
  const [unsentItems, setUnsentItems] = useState<CartItem[]>([]);
  const [sentKOTs, setSentKOTs] = useState<{ kotNumber: number; items: CartItem[] }[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tableInfo, setTableInfo] = useState<import('../../types/models').Table | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>(Number(tableId) === 0 ? 'takeaway' : 'dine-in');
  const [occupiedTime, setOccupiedTime] = useState<string>('');
  const { activeSession } = useBusinessSession();
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
            const loadedSentKots: Record<number, CartItem[]> = {};
            
            orderData.items.forEach((i: OrderItem) => {
              const ci: CartItem = {
                id: i.menu_item_id,
                orderItemId: i.id,
                name: i.name,
                price: i.unit_price,
                qty: i.qty,
                note: i.note ?? '',
                status: i.preparation_status,
                originalQty: i.qty,
                kot_number: i.kot_number
              };
              const kotNum = typeof i.kot_number === 'number' ? i.kot_number : 0;
              if (!(kotNum in loadedSentKots)) { loadedSentKots[kotNum] = []; }
              loadedSentKots[kotNum].push(ci);
            });

            const sent = Object.keys(loadedSentKots)
              .map(k => ({ kotNumber: Number(k), items: loadedSentKots[Number(k)] }))
              .sort((a, b) => b.kotNumber - a.kotNumber);

            setSentKOTs(sent);
            setUnsentItems([]);
          }
        })
        .catch((err: unknown) => { console.error(err); });

      api.tables.getAll().then(res => {
        if (active && res.success && res.data) {
          const t = res.data.find(x => x.id === Number(tableId));
          if (t) { setTableInfo(t); }
        }
      }).catch((err: unknown) => { console.error(err); });
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
      const remainingMins = mins % 60;
      let timeStr = '';
      if (hrs > 0) {
        timeStr += `${hrs}h `;
      }
      timeStr += `${remainingMins}m`;
      setOccupiedTime(timeStr);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => { clearInterval(timer); };
  }, [createdAt]);

  const handleRenameTable = () => {
    if (!tableInfo) { return; }
    let newName = tableInfo.custom_name ?? '';
    showModal({
      title: 'Rename Table (Temporary)',
      content: (
        <div className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Temporary Party/Customer Name</label>
          <input
            type="text"
            className="w-full border rounded p-2"
            defaultValue={newName}
            onChange={(e) => { newName = e.target.value; }}
            autoFocus
          />
        </div>
      ),
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button
            variant="primary"
            onClick={() => {
              hideModal();
              const nameToSet = newName.trim() === '' ? null : newName.trim();
              api.tables.updateCustomName({ id: tableInfo.id, customName: nameToSet }).then(res => {
                if (res.success) {
                  setTableInfo({ ...tableInfo, custom_name: nameToSet });
                  showToast({ message: 'Table name updated temporarily', variant: 'success' });
                } else {
                  showToast({ message: `Failed to rename table: ${res.error ?? 'Unknown error'}`, variant: 'error' });
                }
              }).catch((err: unknown) => {
                showToast({ message: `Error: ${err instanceof Error ? err.message : String(err)}`, variant: 'error' });
              });
            }}
          >
            Save
          </Button>
        </>
      )
    });
  };

  const handleCustomerSelect = async (selected: Customer | null) => {
    setCustomer(selected);
    if (!selected) {
      return;
    }

    if (!activeSession && !orderId) {
      showToast({ message: 'Please start a business day first to create a new order', variant: 'warning' });
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
    setUnsentItems(prev => {
      const existing = prev.find(item => item.id === menuItem.id);
      if (existing) {
        return prev.map(item => item.id === menuItem.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { id: menuItem.id, name: menuItem.name, price: menuItem.price, qty: 1, note: '' }];
    });
  };

  const handleUpdateQty = (id: number, delta: number) => {
    setUnsentItems(prev => prev.map(item => item.id === id ? { ...item, qty: item.qty + delta } : item).filter(item => item.qty > 0));
  };

  const handleUpdateNote = (id: number, note: string) => {
    setUnsentItems(prev => prev.map(item => item.id === id ? { ...item, note } : item));
  };

  const handleCancelItem = (orderItemId: number) => {
    if (!orderId) { return; }
    showModal({
      title: 'Void Item',
      content: <CancelOrderModal onConfirm={(note) => { 
        hideModal();
        api.orders.cancelOrderItem({ orderId, orderItemId, note })
          .then(res => {
            if (res.success) {
              showToast({ message: 'Item cancelled successfully', variant: 'success' });
              if (tableId) {
                api.orders.getByTable({ tableId: Number(tableId) }).then(refreshRes => {
                  if (refreshRes.success && refreshRes.data) {
                    const loadedSentKots: Record<number, CartItem[]> = {};
                    refreshRes.data.items.forEach((i: OrderItem) => {
                      const ci: CartItem = {
                        id: i.menu_item_id, orderItemId: i.id, name: i.name, price: i.unit_price,
                        qty: i.qty, note: i.note ?? '', status: i.preparation_status, kot_number: i.kot_number
                      };
                      const kotNum = typeof i.kot_number === 'number' ? i.kot_number : 0;
                      if (!(kotNum in loadedSentKots)) { loadedSentKots[kotNum] = []; }
                      loadedSentKots[kotNum].push(ci);
                    });
                    setSentKOTs(Object.keys(loadedSentKots).map(k => ({ kotNumber: Number(k), items: loadedSentKots[Number(k)] })).sort((a, b) => b.kotNumber - a.kotNumber));
                  }
                }).catch((err: unknown) => { console.error(err); });
              }
            } else {
              showToast({ message: `Failed to cancel item: ${res.error ?? 'Unknown error'}`, variant: 'error' });
            }
          })
          .catch((err: unknown) => {
             showToast({ message: `Error: ${err instanceof Error ? err.message : String(err)}`, variant: 'error' });
          });
      }} />,
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Go Back</Button>
          <Button type="submit" form="cancel-order-form" variant="danger">Confirm Void</Button>
        </>
      ),
    });
  };

  const handleSendKOT = async (shouldPrint: boolean) => {
    if ((unsentItems.length === 0 && !orderId) || !tableId) {
      return;
    }

    if (!activeSession && !orderId) {
      showToast({ message: 'Please start a business day first to create a new order', variant: 'warning' });
      return;
    }

    const res = await api.orders.sendKOT({
      tableId: Number(tableId),
      items: unsentItems,
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
      setUnsentItems([]);
      hideModal();
      navigate('/tables');
      return;
    }
    try {
      const res = await api.orders.cancelOrder({ orderId, note });
      if (res.success) {
        setUnsentItems([]);
        setSentKOTs([]);
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
              <div className="flex items-center gap-2">
                <span>
                  {(() => {
                    if (!tableInfo) { return `Table ${tableId}`; }
                    if (tableInfo.custom_name) { return `${tableInfo.name} (${tableInfo.custom_name})`; }
                    return tableInfo.name;
                  })()}
                </span>
                <button onClick={handleRenameTable} className="text-blue-500 hover:text-blue-700 focus:outline-none bg-blue-50 rounded-full p-1" title="Set temporary table name">
                  <SvgIcon name="pencil" className="h-3.5 w-3.5" />
                </button>
              </div>
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
          unsentItems={unsentItems}
          sentKOTs={sentKOTs}
          onUpdateQty={handleUpdateQty}
          onUpdateNote={handleUpdateNote}
          onCancelItem={(orderItemId) => { handleCancelItem(orderItemId); }}
          onSendKOT={(print) => { void handleSendKOT(print); }}
          onGenerateBill={() => {
            if (!orderId) {
              showToast({ message: 'Order has not been sent to kitchen yet!', variant: 'warning' });
              return;
            }
            if (unsentItems.length > 0) {
              showToast({ message: 'Please save or send new items before generating bill.', variant: 'warning' });
              return;
            }
            const allItems = sentKOTs.flatMap(k => k.items);
            showModal({
              title: 'Generate Final Bill',
              content: <BillModal ref={billModalRef} orderId={orderId} cart={allItems} initialCustomer={customer} onClose={hideModal} />,
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
