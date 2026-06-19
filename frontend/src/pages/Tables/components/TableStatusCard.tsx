import React, { useState, useEffect } from 'react';
import { SvgIcon } from '../../../components/atoms/svg-sprite-loader';

interface Props {
  name: string;
  capacity: number;
  status: 'available' | 'occupied' | 'bill_requested';
  customerName?: string | null;
  createdAt?: string | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

const TableStatusCard: React.FC<Props> = ({ name, capacity, status, customerName, createdAt, onEdit, onDelete }) => {
  const [occupiedTime, setOccupiedTime] = useState<string>('');

  useEffect(() => {
    if (status === 'available' || !createdAt) {
      setTimeout(() => { setOccupiedTime(''); }, 0);
      return;
    }
    const updateTime = () => {
      const dateStr = createdAt.endsWith('Z') ? createdAt : `${createdAt.replace(' ', 'T')  }Z`;
      const ms = Date.now() - new Date(dateStr).getTime();
      const mins = Math.max(0, Math.floor(ms / 60000));
      const hrs = Math.floor(mins / 60);
      const remainingMins = mins % 60;
      setOccupiedTime(`${hrs.toString().padStart(2, '0')}:${remainingMins.toString().padStart(2, '0')}`);
    };
    updateTime();
    const timerId = setInterval(updateTime, 60000);
    return () => { clearInterval(timerId); };
  }, [createdAt, status]);

  const statusColors = {
    available: 'bg-emerald-500/10 text-emerald-700 border-emerald-200/50',
    occupied: 'bg-amber-500/10 text-amber-700 border-amber-200/50',
    bill_requested: 'bg-rose-500/10 text-rose-700 border-rose-200/50 animate-pulse',
  };

  const bgGradients = {
    available: 'bg-gradient-to-br from-white to-emerald-50/50',
    occupied: 'bg-gradient-to-br from-white to-amber-50/50',
    bill_requested: 'bg-gradient-to-br from-white to-rose-50/50',
  };

  const statusBars = {
    available: 'bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)]',
    occupied: 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.4)]',
    bill_requested: 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-[0_0_10px_rgba(225,29,72,0.4)]',
  };

  const statusLabels = {
    available: 'Available',
    occupied: 'Occupied',
    bill_requested: 'Bill Req.',
  };

  return (
    <div className={`group relative overflow-hidden rounded-2xl border border-white/40 shadow-sm transition-all duration-500 hover:shadow-xl hover:-translate-y-1.5 cursor-pointer flex flex-col h-full ${bgGradients[status]} backdrop-blur-sm`}>
      {/* Top Status Bar indicator with Glow */}
      <div className={`h-1.5 w-full ${statusBars[status]} transition-colors duration-500`} />
      
      <div className="p-4 flex flex-col flex-1 relative z-10">
        {/* Actions (visible on hover) */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-[-10px] group-hover:translate-y-0 flex space-x-1 z-20">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(); }} 
              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100/80 rounded-xl transition-all"
              aria-label="Edit Table"
            >
              <SvgIcon name="pencil" width="14" height="14" />
            </button>
          )}
          {onDelete && status === 'available' && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(); }} 
              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-100/80 rounded-xl transition-all"
              aria-label="Delete Table"
            >
              <SvgIcon name="trash" width="14" height="14" />
            </button>
          )}
        </div>

        <div className="flex justify-between items-start mb-4 mt-1">
          <div className="flex-1">
            <h3 className="text-xl font-black text-gray-900 tracking-tight leading-none mb-1.5 drop-shadow-sm">{name}</h3>
            {status !== 'available' && (
              <p className="text-sm font-bold text-gray-700/80 mb-2 truncate pr-2">
                {customerName ?? 'Walk-in'}
              </p>
            )}
            <div className="flex items-center text-xs font-bold text-gray-500/80 gap-1.5 bg-black/5 w-max px-2 py-1 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{capacity} Seats</span>
            </div>
          </div>
          {occupiedTime && (
            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md rounded-lg px-2 py-1 text-xs font-mono font-bold text-gray-700 shadow-sm border border-gray-100">
              <SvgIcon name="clock" className="h-3.5 w-3.5 text-amber-500" aria-hidden={true} />
              {occupiedTime}
            </div>
          )}
        </div>

        <div className="mt-auto pt-3 border-t border-gray-200/50 flex items-center justify-between">
          <span className={`text-[10px] px-2.5 py-1 rounded-xl border font-extrabold uppercase tracking-widest transition-colors ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
          
          {/* Subtle decoration to indicate interactivity */}
          <div className="text-gray-400/50 opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-x-1 duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableStatusCard;
