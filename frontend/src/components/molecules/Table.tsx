import React from 'react';

// Main Table Wrapper
export const Table = ({ children, className = '' }: React.HTMLAttributes<HTMLTableElement>) => (
  <div className={`bg-white shadow overflow-hidden sm:rounded-lg ${className}`}>
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {children}
      </table>
    </div>
  </div>
);

// Table Header
export const TableHeader = ({ children, className = '' }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={`bg-gray-50 ${className}`}>
    {children}
  </thead>
);

// Table Body
export const TableBody = ({ children, className = '' }: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={`bg-white divide-y divide-gray-200 ${className}`}>
    {children}
  </tbody>
);

// Table Row
export const TableRow = ({ children, className = '', ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr className={`hover:bg-gray-50 transition-colors ${className}`} {...props}>
    {children}
  </tr>
);

// Table Head Cell
export const TableHead = ({ children, className = '', ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${className}`} {...props}>
    {children}
  </th>
);

// Table Body Cell
export const TableCell = ({ children, className = '', colSpan, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td className={`px-6 py-4 whitespace-nowrap ${className}`} colSpan={colSpan} {...props}>
    {children}
  </td>
);
