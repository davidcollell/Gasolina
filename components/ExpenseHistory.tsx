
import React from 'react';
import { type ExpenseEntry } from '../types';
import { TrashIcon, CalendarIcon, DropletIcon, EuroIcon, TachometerIcon, ExportIcon } from './icons';

interface ExpenseHistoryProps {
  expenses: ExpenseEntry[];
  onInitiateDelete: (id: number) => void;
  newlyAddedId?: number | null;
}

const ExpenseHistory: React.FC<ExpenseHistoryProps> = ({ expenses, onInitiateDelete, newlyAddedId }) => {

  const handleExport = () => {
    if (expenses.length === 0) {
        alert("No hay datos para exportar.");
        return;
    }

    const sortedForExport = [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const headers = [
        "ID",
        "Fecha",
        "Litros",
        "Precio por Litro (€)",
        "Coste Total (€)",
        "Odómetro (km)"
    ];
    
    // Semicolon as separator for better compatibility with Excel in spanish locale
    const toCsvRow = (arr: (string | number)[]) => arr.join(';');

    const csvContent = [
        headers.join(';'),
        ...sortedForExport.map(e => toCsvRow([
            e.id,
            new Date(e.date).toISOString().split('T')[0], // YYYY-MM-DD format
            String(e.liters).replace('.', ','), // Use comma as decimal separator
            String(e.pricePerLiter).replace('.', ','),
            String(e.totalCost).replace('.', ','),
            e.odometer
        ]))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'historial_gastos_gasolina.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };


  return (
    <div className="bg-base-200 shadow-lg rounded-lg overflow-hidden">
      <div className="p-4 sm:p-6 border-b border-base-300 flex justify-between items-center">
        <h2 className="text-xl font-bold text-text-primary">Historial de Gastos</h2>
        {expenses.length > 0 && (
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 border border-base-300 text-sm font-medium rounded-md text-text-secondary hover:bg-base-300 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-200 transition-colors"
            aria-label="Exportar datos a CSV"
          >
            <ExportIcon className="w-5 h-5" />
            <span>Exportar</span>
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        {expenses.length === 0 ? (
          <p className="text-center py-10 text-text-secondary">No hay registros para mostrar.</p>
        ) : (
          <table className="min-w-full divide-y divide-base-300">
            <thead className="bg-base-300/50 hidden md:table-header-group">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Fecha</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Coste Total</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Litros</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Precio/Litro</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Odómetro</th>
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
                    className={`md:table-row flex flex-col md:flex-row p-4 md:p-0 mb-4 md:mb-0 bg-base-200 rounded-lg md:rounded-none shadow-md md:shadow-none hover:bg-base-300/50 transition-colors animate-fadeInUp ${isNew ? 'animate-highlight' : ''}`}
                    style={{ animationDelay: `${Math.min(index * 75, 750)}ms` }}
                  >
                    <td className="px-6 py-2 md:py-4 whitespace-nowrap text-sm font-medium text-text-primary flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-text-secondary md:hidden" />
                      <span className="font-bold md:font-medium">
                        {new Date(expense.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                     <td className="px-6 py-2 md:py-4 whitespace-nowrap text-sm font-bold text-brand-primary grid grid-cols-2 md:table-cell order-first md:order-none">
                      <span className="font-medium text-text-secondary flex items-center gap-2 md:hidden"><EuroIcon className="w-4 h-4"/> Coste Total</span>
                      <span>{expense.totalCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</span>
                    </td>
                    <td className="px-6 py-2 md:py-4 whitespace-nowrap text-sm text-text-secondary grid grid-cols-2 md:table-cell">
                      <span className="flex items-center gap-2 md:hidden"><DropletIcon className="w-4 h-4"/> Litros</span>
                      <span>{expense.liters > 0 ? `${expense.liters.toFixed(2)} L` : '-'}</span>
                    </td>
                    <td className="px-6 py-2 md:py-4 whitespace-nowrap text-sm text-text-secondary grid grid-cols-2 md:table-cell">
                      <span className="flex items-center gap-2 md:hidden"><EuroIcon className="w-4 h-4"/> Precio/Litro</span>
                      <span>{expense.pricePerLiter > 0 ? expense.pricePerLiter.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }) : '-'}</span>
                    </td>
                    <td className="px-6 py-2 md:py-4 whitespace-nowrap text-sm text-text-secondary grid grid-cols-2 md:table-cell">
                      <span className="flex items-center gap-2 md:hidden"><TachometerIcon className="w-4 h-4"/> Odómetro</span>
                      <span>{expense.odometer > 0 ? `${expense.odometer.toLocaleString('es-ES')} km` : '-'}</span>
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
