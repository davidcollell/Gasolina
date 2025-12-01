
import React from 'react';
import { type ExpenseEntry } from '../types';
import { TrashIcon, CalendarIcon, EuroIcon, ExportIcon } from './icons';

interface ExpenseHistoryProps {
  expenses: ExpenseEntry[];
  onInitiateDelete: (id: number) => void;
  newlyAddedId?: number | null;
}

const ExpenseHistory: React.FC<ExpenseHistoryProps> = ({ expenses, onInitiateDelete, newlyAddedId }) => {

  const handleExport = () => {
    if (expenses.length === 0) {
        alert("No hi ha dades per exportar.");
        return;
    }

    const sortedForExport = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const headers = [
        "ID",
        "Data",
        "Cost Total (€)"
    ];
    
    // Semicolon as separator for better compatibility with Excel in spanish/catalan locale
    const toCsvRow = (arr: (string | number)[]) => arr.join(';');

    const csvContent = [
        headers.join(';'),
        ...sortedForExport.map(e => toCsvRow([
            e.id,
            new Date(e.date).toISOString().split('T')[0], // YYYY-MM-DD format
            String(e.totalCost).replace('.', ',')
        ]))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'historial_despeses_benzina.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="bg-base-200 shadow-lg rounded-lg overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-base-300 flex justify-between items-center">
        <h2 className="text-xl font-bold text-text-primary">Historial de Despeses</h2>
        {expenses.length > 0 && (
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 border border-base-300 text-sm font-medium rounded-md text-text-secondary hover:bg-base-300 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-200 transition-colors"
            aria-label="Exportar dades a CSV"
          >
            <ExportIcon className="w-5 h-5" />
            <span>Exportar</span>
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        {expenses.length === 0 ? (
          <p className="text-center py-10 text-text-secondary">No hi ha registres per mostrar.</p>
        ) : (
          <table className="min-w-full divide-y divide-base-300">
            <thead className="bg-base-300/50 hidden md:table-header-group">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Data</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cost Total</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Eliminar</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-base-200 divide-y divide-base-300">
              {expenses.map((expense, index) => {
                const isNew = expense.id === newlyAddedId;
                return (
                  <tr 
                    key={expense.id} 
                    className={`md:table-row flex flex-row justify-between items-center p-4 md:p-0 mb-4 md:mb-0 bg-base-200 rounded-lg md:rounded-none shadow-md md:shadow-none hover:bg-base-300/50 transition-colors animate-fadeInUp ${isNew ? 'animate-highlight' : ''}`}
                    style={{ animationDelay: `${Math.min(index * 75, 750)}ms` }}
                  >
                    <td className="px-6 py-2 md:py-4 whitespace-nowrap text-sm font-medium text-text-primary flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-text-secondary md:hidden" />
                      <span className="font-bold md:font-medium text-lg md:text-sm">
                        {new Date(expense.date).toLocaleDateString('ca-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                     <td className="px-6 py-2 md:py-4 whitespace-nowrap text-sm font-bold text-brand-primary md:table-cell">
                      <div className="flex items-center gap-2 md:hidden text-text-secondary font-normal mb-1">
                          <EuroIcon className="w-4 h-4"/> 
                          <span>Cost Total</span>
                      </div>
                      <span className="text-xl md:text-sm">{expense.totalCost.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })}</span>
                    </td>
                    <td className="px-6 py-2 md:py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => onInitiateDelete(expense.id)} className="text-red-500 hover:text-red-400 p-2 rounded-full hover:bg-red-500/10 transition-colors">
                        <TrashIcon className="w-5 h-5" />
                        <span className="sr-only">Eliminar</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default ExpenseHistory;
