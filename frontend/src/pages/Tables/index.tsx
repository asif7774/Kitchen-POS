import { Button } from '../../components/atoms';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/ipc';
import TableStatusCard from './components/TableStatusCard';
import { useOrderStore } from '../../store/order';
import TableModal from './components/TableModal';
import { useHeader } from '../../contexts/HeaderContext';
import { useModal } from '../../hooks/useModal';

import { Table } from '../../types/models';

const TablesPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const { showModal, hideModal } = useModal();
  const navigate = useNavigate();
  const { activeOrders, fetchOpenOrders, selectTable } = useOrderStore();

  const loadData = useCallback(async () => {
    const res = await api.tables.getAll();
    if (res.success && res.data) {
      setTables(res.data);
    }
    await fetchOpenOrders();
  }, [fetchOpenOrders]);

  useEffect(() => {
    let mounted = true;
    api.tables.getAll()
      .then(res => {
        if (mounted && res.success && res.data) {
          setTables(res.data);
        }
      })
      .catch((err: unknown) => { console.error(err); });

    void fetchOpenOrders();
    
    // Polling to keep tables synced across windows
    const intervalId = setInterval(() => {
      void fetchOpenOrders();
    }, 5000);

    return () => { 
      mounted = false; 
      clearInterval(intervalId);
    };
  }, [fetchOpenOrders]);

  const { setHeader } = useHeader();
  const handleAddTable = React.useCallback(() => {
    showModal({
      title: "Add New Table",
      content: <TableModal onSaved={() => { hideModal(); void loadData(); }} />,
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button type="submit" form="table-form" variant="primary">Create</Button>
        </>
      )
    });
  }, [showModal, hideModal, loadData]);

  useEffect(() => {
    setHeader('Table Management', <Button variant="primary" icon="plus" onClick={handleAddTable}>Add Table</Button>);
    return () => { setHeader(null, null); };
  }, [setHeader, handleAddTable]);

  const handleTableClick = (id: number) => {
    selectTable(id);
    navigate(`/order/${id}`);
  };

  const handleEdit = (table: Table) => {
    showModal({
      title: 'Edit Table',
      content: <TableModal table={table} onSaved={() => { hideModal(); void loadData(); }} />,
      actions: (
        <>
          <Button variant="outline" onClick={hideModal}>Cancel</Button>
          <Button type="submit" form="table-form" variant="primary">Update</Button>
        </>
      )
    });
  };

  const handleDelete = async (id: number) => {
    const res = await api.tables.delete({ id });
    if (res.success) {
      void loadData();
    } else {
      console.error('Failed to delete table');
    }
  };

  const getTableStatus = (tableId: number) => {
    const order = activeOrders.find(o => o.table_id === tableId);
    if (!order) {return 'available';}
    if (order.status === 'billed') {return 'bill_requested';}
    return 'occupied';
  };

  return (
    <>
      <div className="container-responsive p-6">

      <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {tables.map(table => {
          const order = activeOrders.find(o => o.table_id === table.id);
          return (
            <div key={table.id} onClick={() => { handleTableClick(table.id); }}>
                <TableStatusCard
                  name={table.custom_name ? `${table.name} (${table.custom_name})` : table.name}
                  capacity={table.capacity}
                  status={getTableStatus(table.id)}
                  customerName={order?.customer_name}
                  createdAt={order?.created_at}
                  onEdit={() => { handleEdit(table); }}
                  onDelete={() => { void handleDelete(table.id); }}
                />
            </div>
          );
        })}
      </div>


      </div>
    </>
  );
};

export default TablesPage;
