import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/ipc';
import TableStatusCard from './components/TableStatusCard';
import { useOrderStore } from '../../store/order';

import { Table } from '../../types/models';

const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const navigate = useNavigate();
  const { activeOrders, fetchOpenOrders, selectTable } = useOrderStore();

  useEffect(() => {
    const loadData = async () => {
      const res = await api.tables.getAll();
      if (res.success && res.data) {
        setTables(res.data as Table[]);
      }
      await fetchOpenOrders();
    };
    void loadData();
  }, [fetchOpenOrders]);

  const handleTableClick = (id: number) => {
    selectTable(id);
    navigate(`/order/${id}`);
  };

  const getTableStatus = (tableId: number) => {
    const order = activeOrders.find(o => o.table_id === tableId);
    if (!order) {return 'available';}
    if (order.status === 'billed') {return 'bill_requested';}
    return 'occupied';
  };

  return (
    <div className="container-responsive p-6">
      <h1 className="text-2xl font-bold mb-6">Floor Plan</h1>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {tables.map(table => (
          <div key={table.id} onClick={() => { handleTableClick(table.id); }}>
            <TableStatusCard
              name={table.name}
              capacity={table.capacity}
              status={getTableStatus(table.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TablesPage;
