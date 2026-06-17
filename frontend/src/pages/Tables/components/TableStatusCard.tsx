import React from 'react';

interface Props {
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'bill_requested';
}

const TableStatusCard: React.FC<Props> = ({ name, capacity, status }) => {
  const statusColors = {
    available: 'bg-green-100 text-green-800 border-green-200',
    occupied: 'bg-amber-100 text-amber-800 border-amber-200',
    bill_requested: 'bg-red-100 text-red-800 border-red-200',
  };

  const statusLabels = {
    available: 'Available',
    occupied: 'Occupied',
    bill_requested: 'Bill Req.',
  };

  return (
    <div className="card p-4 flex flex-col items-center justify-center hover-lift cursor-pointer shadow-sm border h-32 rounded">
      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[status]}`}>
        {statusLabels[status]}
      </span>
      <span className="text-sm text-gray-500 mt-2">Covers: {capacity}</span>
    </div>
  );
};

export default TableStatusCard;
