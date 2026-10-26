import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../../lib/ipc';
import { useMutation } from '../../../hooks/useMutation';
import { CartItem, MenuItem, Customer, Menu, OrderItem } from '../../../types/models';
import { useToast } from '../../../hooks/useToast';
import { useAuthStore } from '../../../store/auth';
import { useBusinessSession } from '../../../contexts/BusinessSessionContext';

export function useOrderManager(tableIdStr: string | undefined) {
  const tableId = tableIdStr ? Number(tableIdStr) : null;
  const staff = useAuthStore(s => s.staff);
  const { activeSession } = useBusinessSession();
  const { showToast } = useToast();

  const [unsentItems, setUnsentItems] = useState<CartItem[]>([]);
  const [sentKOTs, setSentKOTs] = useState<{ kotNumber: number; items: CartItem[] }[]>([]);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [tableInfo, setTableInfo] = useState<import('../../../types/models').Table | null>(null);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway' | 'delivery'>(tableId === 0 ? 'takeaway' : 'dine-in');
  const [occupiedTime, setOccupiedTime] = useState<string>('');
  
  const [menus, setMenus] = useState<Menu[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  // Keep track of current state for unmount cleanup
  const stateRef = useRef({ orderId, unsentItems, tableInfo });
  useEffect(() => {
    stateRef.current = { orderId, unsentItems, tableInfo };
  }, [orderId, unsentItems, tableInfo]);

  // Clean up temporary name if user leaves without creating an order
  useEffect(() => {
    return () => {
      const { orderId: currentOrderId, unsentItems: currentUnsent, tableInfo: currentTable } = stateRef.current;
      if (!currentOrderId && currentUnsent.length === 0 && currentTable?.custom_name) {
        api.tables.updateCustomName({ id: currentTable.id, customName: null }).catch(console.error);
      }
    };
  }, []);

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

  const refreshOrderState = useCallback(async () => {
    if (tableId === null) { return; }
    const res = await api.orders.getByTable({ tableId });
    if (res.success && res.data) {
      const orderData = res.data;
      setOrderId(orderData.id);
      setCreatedAt(orderData.created_at);
      setOrderType(orderData.type);
      if (orderData.customer_id) {
        const custRes = await api.customers.getById(orderData.customer_id);
        if (custRes.success && custRes.data) {
          setCustomer(custRes.data);
        } else {
          setCustomer({
            id: orderData.customer_id,
            name: orderData.customer_name ?? 'Unknown',
            phone: null, email: null, loyalty_points: 0, total_visits: 0,
            credit_limit: 0, outstanding_balance: 0, created_at: '',
          });
        }
      }
      const loadedSentKots: Record<number, CartItem[]> = {};
      
      orderData.items.forEach((i: OrderItem) => {
        const ci: CartItem = {
          id: i.menu_item_id, orderItemId: i.id, name: i.name, price: i.unit_price,
          qty: i.qty, note: i.note ?? '', status: i.preparation_status, kot_number: i.kot_number, originalQty: i.qty
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
    } else {
      // No active order — clear any stale custom_name left from a previous failed billing
      void api.tables.updateCustomName({ id: tableId, customName: null });
    }
  }, [tableId]);

  useEffect(() => {
    let active = true;
    if (tableId !== null) {
      Promise.resolve().then(() => refreshOrderState()).catch(console.error);
      api.tables.getAll().then(res => {
        if (active && res.success && res.data) {
          const t = res.data.find(x => x.id === tableId);
          if (t) { setTableInfo(t); }
        }
      }).catch(console.error);
    }
    return () => { active = false; };
  }, [tableId, refreshOrderState]);

  useEffect(() => {
    if (!createdAt) {
      const timer = setTimeout(() => { setOccupiedTime(''); }, 0);
      return () => { clearTimeout(timer); };
    }
    const updateTime = () => {
      const dateStr = createdAt.endsWith('Z') ? createdAt : `${createdAt.replace(' ', 'T')}Z`;
      const ms = Math.max(0, Date.now() - new Date(dateStr).getTime());
      const mins = Math.floor(ms / 60000);
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      let timeStr = '';
      if (hrs > 0) {timeStr += `${hrs}h `;}
      timeStr += `${remainingMins}m`;
      setOccupiedTime(timeStr);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => { clearInterval(timer); };
  }, [createdAt]);

  const renameMutation = useMutation(api.tables.updateCustomName, {
    successMessage: 'Table name updated temporarily',
    errorMessage: err => `Failed to rename table: ${err}`,
  });

  const handleRenameTable = async (newName: string | null) => {
    if (!tableInfo) {return false;}
    try {
      await renameMutation.mutate({ id: tableInfo.id, customName: newName });
      setTableInfo({ ...tableInfo, custom_name: newName });
      return true;
    } catch {
      return false;
    }
  };

  const createOrderMutation = useMutation(api.orders.create, {
    successMessage: () => `Table reserved successfully`,
  });

  const handleCustomerSelect = async (selected: Customer | null) => {
    setCustomer(selected);

    if (!activeSession && !orderId) {
      showToast({ message: 'Please start a business day first to create a new order', variant: 'warning' });
      return;
    }

    if (orderId) {
      await api.orders.updateCustomer({ orderId, customerId: selected?.id ?? null });
    } else if (tableId !== null && selected) {
      const res = await createOrderMutation.mutate({
        tableId,
        staffId: staff?.id,
        customerId: selected.id,
        type: orderType,
      });
      if (res) {
        setOrderId(res);
        setCreatedAt(new Date().toISOString());
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

  const cancelItemMutation = useMutation(api.orders.cancelOrderItem, {
    successMessage: 'Item cancelled successfully',
    errorMessage: err => `Failed to cancel item: ${err}`,
  });

  const handleCancelItem = async (orderItemId: number, note: string) => {
    if (!orderId) {return false;}
    try {
      await cancelItemMutation.mutate({ orderId, orderItemId, note });
      await refreshOrderState();
      return true;
    } catch {
      return false;
    }
  };

  const sendKOTMutation = useMutation(api.orders.sendKOT, {
    errorMessage: err => `Failed to send KOT: ${err}`,
  });

  const handleSendKOT = async (shouldPrint: boolean) => {
    if ((unsentItems.length === 0 && !orderId) || tableId === null) {return false;}

    if (!activeSession && !orderId) {
      showToast({ message: 'Please start a business day first to create a new order', variant: 'warning' });
      return false;
    }

    const res = await sendKOTMutation.mutate({
      tableId,
      items: unsentItems,
      staffId: staff?.id,
      customerId: customer?.id,
      type: orderType,
    });

    if (res) {
      if (shouldPrint) {
        if (res.itemsToPrint.length > 0) {
          api.print.kot({ items: res.itemsToPrint, tableName: `Table ${tableId}`, orderNote: '' }).catch(console.error);
        } else {
          showToast({ message: 'No new items to print.', variant: 'warning' });
        }
      } else {
        showToast({ message: 'Order saved successfully.', variant: 'success' });
      }
      await refreshOrderState();
      return true;
    }
    return false;
  };

  const cancelOrderMutation = useMutation(api.orders.cancelOrder, {
    errorMessage: err => `Failed to cancel order: ${err}`,
  });

  const handleCancelOrder = async (note: string) => {
    if (tableId === null) {return false;}
    if (!orderId) {
      setUnsentItems([]);
      return true;
    }
    try {
      await cancelOrderMutation.mutate({ orderId, note });
      setUnsentItems([]);
      setSentKOTs([]);
      return true;
    } catch {
      return false;
    }
  };

  return {
    tableId,
    orderId,
    customer,
    tableInfo,
    orderType,
    setOrderType,
    occupiedTime,
    menus,
    activeMenuId,
    setActiveMenuId,
    unsentItems,
    sentKOTs,
    handleRenameTable,
    handleCustomerSelect,
    handleAddItem,
    handleUpdateQty,
    handleUpdateNote,
    handleCancelItem,
    handleSendKOT,
    handleCancelOrder,
  };
}
