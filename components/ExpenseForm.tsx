
import React, { useState } from 'react';
import { type ExpenseEntry } from '../types';
import { PlusIcon, CloseIcon } from './icons';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<ExpenseEntry, 'id' | 'vehicleId'>) => void;
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, onCancel }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalCost, setTotalCost] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !totalCost) {
        alert("Por favor, rellena todos los campos.");
        return;
    }

    const newExpense = {
      date,
      totalCost: parseFloat(totalCost),
      // Valores por defecto ya que el usuario no los introduce
      liters: 0,
      pricePerLiter: 0,
      odometer: 0,
    };

    onAddExpense(newExpense);
    // Reset form fields
    setDate(new Date().toISOString().split('T')[0]);
    setTotalCost('');
  };

  const commonInputClasses = "w-full px-3 py-2 bg-base-200 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors";

  return (
    <div className="bg-base-100 p-6 rounded-lg shadow-2xl w-full max-w-md mx-auto relative border border-base-300">
      <button onClick={onCancel} className="absolute top-3 right-3 text-text-secondary hover:text-text-primary transition-colors">
        <CloseIcon className="w-6 h-6" />
      </button>
      <h2 className="text-xl font-bold mb-6 text-text-primary">Añadir Gasto</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-1">Fecha</label>
          <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className={commonInputClasses} required />
        </div>
        
        <div>
          <label htmlFor="totalCost" className="block text-sm font-medium text-text-secondary mb-1">Importe Pagado (€)</label>
          <div className="relative">
            <input 
                type="number" 
                id="totalCost" 
                value={totalCost} 
                onChange={e => setTotalCost(e.target.value)} 
                step="0.01" 
                min="0" 
                placeholder="Ej: 50.00" 
                className={`${commonInputClasses} pl-8 text-lg font-semibold`} 
                required 
                autoFocus
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-text-secondary">€</span>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-md text-text-primary bg-base-300 hover:bg-gray-500 transition-colors">Cancelar</button>
            <button type="submit" className="flex items-center justify-center gap-2 px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-100 transition-colors">
              <PlusIcon className="w-5 h-5" />
              Guardar
            </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;
