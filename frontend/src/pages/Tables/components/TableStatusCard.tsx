import React from 'react';
import { SvgIcon } from '../../../components/atoms/svg-sprite-loader';

interface Props {
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'bill_requested';
  onEdit?: () => void;
  onDelete?: () => void;
}

const TableStatusCard: React.FC<Props> = ({ name, capacity, status, onEdit, onDelete }) => {
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
    <div className="card p-4 flex flex-col items-center justify-center hover-lift shadow-sm border h-32 rounded relative group cursor-pointer">
      {/* Actions (visible on hover) */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
        {onEdit && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(); }} 
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
            aria-label="Edit Table"
          >
            <SvgIcon name="pencil" width="14" height="14" />
          </button>
        )}
        {onDelete && status === 'available' && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }} 
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            aria-label="Delete Table"
          >
            <SvgIcon name="trash" width="14" height="14" />
          </button>
        )}
      </div>

      <h3 className="text-xl font-bold mb-2">{name}</h3>
      <span className={`text-xs px-2 py-1 rounded-full border ${statusColors[status]}`}>
        {statusLabels[status]}
      </span>
      <span className="text-sm text-gray-500 mt-2">Covers: {capacity}</span>
    </div>
  );
};

export default TableStatusCard;
