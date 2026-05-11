/**
 * ========================================
 * DATA TABLE COMPONENT
 * ========================================
 * 
 * Reusable component for displaying tabular data in admin dashboards (users, opportunities,
 * applications). Supports sorting by clicking column headers, custom column rendering,
 * and displays helpful message when no data. Scrolls horizontally on small screens.
 * 
 * @author Anxhela Valisi
 * @contributor Megi Shehi
 */

import React from 'react';

const DataTable = ({
  columns,
  data,
  keyField = 'id',
  sortable = false,
  onSort,
  emptyMessage = 'No data available.',
  className = '',
  rowClassName = '',
  headerClassName = '',
}) => {
  const [sortColumn, setSortColumn] = React.useState(null);
  const [sortDirection, setSortDirection] = React.useState('asc');

  // ===== HANDLE COLUMN SORTING =====
  // Izabela: "When user clicks a column header, toggle sort direction or change column"
  const handleSort = (columnKey) => {
    if (!sortable || !onSort) return;
    let newDirection = 'asc';
    // If already sorting by this column, toggle direction
    if (sortColumn === columnKey) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    setSortColumn(columnKey);
    setSortDirection(newDirection);
    onSort(columnKey, newDirection);
  };

  // ===== RENDER TABLE CELL =====
  // Megi: "Use custom render function if provided, otherwise just display the value"
  const renderCell = (item, column) => {
    if (column.render) {
      return column.render(item);
    }
    return item[column.key] || '';
  };

  return (
    <div className={`overflow-x-auto rounded-lg border border-gray-200 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {/* ===== TABLE HEADER ===== */}
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${headerClassName} ${sortable && col.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''}`}
                onClick={() => col.sortable !== false && handleSort(col.key)}
              >
                <div className="flex items-center">
                  {/* Column title */}
                  {col.title}
                  {/* ===== SORT INDICATOR ===== */}
                  {/* Anxhela: "Show up/down arrow if this column is currently sorted" */}
                  {sortable && sortColumn === col.key && (
                    <span className="ml-1">
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        
        {/* ===== TABLE BODY ===== */}
        <tbody className="bg-white divide-y divide-gray-200">
          {data.length > 0 ? (
            data.map((item) => (
              <tr key={item[keyField]} className={`hover:bg-gray-50 transition-colors ${rowClassName}`}>
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {renderCell(item, col)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="px-6 py-12 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;