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
    available: 'bg-green-100 text-green-700 border-green-200',
    occupied: 'bg-amber-100 text-amber-700 border-amber-200',
    bill_requested: 'bg-red-100 text-red-700 border-red-200 animate-pulse',
  };

  const statusBars = {
    available: 'bg-gradient-to-r from-green-400 to-green-500',
    occupied: 'bg-gradient-to-r from-amber-400 to-amber-500',
    bill_requested: 'bg-gradient-to-r from-red-500 to-red-600',
  };

  const statusLabels = {
    available: 'Available',
    occupied: 'Occupied',
    bill_requested: 'Bill Req.',
  };

  return (
    <div className="group relative overflow-hidden rounded-xl bg-white border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1 cursor-pointer flex flex-col h-full">
      {/* Top Status Bar indicator */}
      <div className={`h-1 w-full ${statusBars[status]} transition-colors duration-300`} />
      
      <div className="p-3.5 flex flex-col flex-1 relative">
        {/* Actions (visible on hover) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 z-10">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }} 
              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              aria-label="Edit Table"
            >
              <SvgIcon name="pencil" width="14" height="14" />
            </button>
          )}
          {onDelete && status === 'available' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              aria-label="Delete Table"
            >
              <SvgIcon name="trash" width="14" height="14" />
            </button>
          )}
        </div>

        <div className="flex justify-between items-start mb-3 mt-0.5">
          <div>
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight leading-none mb-1.5">{name}</h3>
            <div className="flex items-center text-xs font-medium text-gray-500 gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{capacity} Seats</span>
            </div>
          </div>
        </div>

        <div className="mt-auto pt-2 border-t border-gray-50 flex items-center justify-between">
          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase tracking-wider transition-colors ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
          
          {/* Subtle decoration to indicate interactivity */}
          <div className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity transform group-hover:translate-x-1 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableStatusCard;
