
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
        "Cost Total (€)",
        "Observacions"
    ];
    
    // Semicolon as separator for better compatibility with Excel in spanish/catalan locale
    const toCsvRow = (arr: (string | number)[]) => arr.join(';');

    const csvContent = [
        headers.join(';'),
        ...sortedForExport.map(e => toCsvRow([
            e.id,
            new Date(e.date).toISOString().split('T')[0], // YYYY-MM-DD format
            String(e.totalCost).replace('.', ','),
            // Replace semicolons and newlines in notes to avoid breaking CSV
            e.notes ? `"${e.notes.replace(/"/g, '""').replace(/;/g, ',').replace(/\n/g, ' ')}"` : '""'
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
    <div className="md:bg-base-200 md:shadow-lg md:rounded-lg overflow-hidden bg-transparent shadow-none">
      <div className="p-4 sm:p-6 md:border-b md:border-base-300 flex justify-between items-center bg-base-200 rounded-lg md:rounded-none shadow-md md:shadow-none mb-6 md:mb-0">
        <h2 className="text-xl font-bold text-text-primary">Historial de Despeses</h2>
        {expenses.length > 0 && (
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 border border-base-300 text-sm font-medium rounded-md text-text-secondary hover:bg-base-300 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-200 transition-colors"
            aria-label="Exportar dades a CSV"
          >
            <ExportIcon className="w-5 h-5" />
            <span className="hidden sm:inline">Exportar</span>
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        {expenses.length === 0 ? (
          <p className="text-center py-10 text-text-secondary bg-base-200 rounded-lg md:rounded-none">No hi ha registres per mostrar.</p>
        ) : (
          <table className="min-w-full md:divide-y md:divide-base-300 block md:table">
            <thead className="bg-base-300/50 hidden md:table-header-group">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider w-1/2">Data i Detalls</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Cost Total</th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Eliminar</span>
                </th>
              </tr>
            </thead>
            <tbody className="md:bg-base-200 md:divide-y md:divide-base-300 block md:table-row-group">
              {expenses.map((expense, index) => {
                const isNew = expense.id === newlyAddedId;
                return (
                  <tr 
                    key={expense.id} 
                    className={`
                      relative flex flex-col md:table-row 
                      p-5 md:p-0 mb-4 md:mb-0 
                      bg-base-200 md:bg-transparent 
                      rounded-xl md:rounded-none 
                      shadow-md md:shadow-none 
                      border border-base-300 md:border-transparent
                      transition-all duration-500 animate-fadeInUp 
                      ${isNew ? 'ring-2 ring-brand-primary bg-brand-primary/5' : ''}
                    `}
                    style={{ animationDelay: `${Math.min(index * 75, 750)}ms` }}
                  >
                    {/* Botón Eliminar (Mobile Absolute) */}
                    <td className="absolute top-4 right-4 md:hidden">
                       <button onClick={() => onInitiateDelete(expense.id)} className="text-text-secondary hover:text-red-500 p-1 rounded-full transition-colors">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </td>

                    {/* Data i Detalls */}
                    <td className="px-0 md:px-6 py-1 md:py-4 text-sm font-medium text-text-primary block md:table-cell w-full md:w-auto">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1 md:mb-0">
                          <CalendarIcon className="w-4 h-4 text-brand-primary md:hidden" />
                          <span className="text-sm font-bold md:font-medium text-text-primary uppercase md:normal-case tracking-wide md:tracking-normal opacity-80 md:opacity-100">
                              {new Date(expense.date).toLocaleDateString('ca-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        {expense.notes && (
                            <p className="text-sm text-text-secondary mt-2 md:mt-0.5 italic pl-0 md:pl-0 border-l-2 border-base-300 md:border-0 pl-3 md:pl-0">
                              {expense.notes}
                            </p>
                        )}
                      </div>
                    </td>

                     {/* Cost Total */}
                     <td className="px-0 md:px-6 py-1 md:py-4 whitespace-nowrap text-brand-primary block md:table-cell w-full md:w-auto mt-2 md:mt-0">
                      <div className="flex flex-col md:block">
                          <span className="text-xs text-text-secondary uppercase tracking-wider mb-0.5 md:hidden">Cost Total</span>
                          <span className="text-2xl md:text-sm font-bold">{expense.totalCost.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })}</span>
                      </div>
                    </td>

                    {/* Botón Eliminar (Desktop) */}
                    <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
