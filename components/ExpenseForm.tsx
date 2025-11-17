
import React, { useState, useEffect } from 'react';
import { type ExpenseEntry } from '../types';
import { PlusIcon, CloseIcon } from './icons';

interface ExpenseFormProps {
  onAddExpense: (expense: Omit<ExpenseEntry, 'id' | 'vehicleId'>) => void;
  onCancel: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, onCancel }) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [liters, setLiters] = useState('');
  const [pricePerLiter, setPricePerLiter] = useState('');
  const [odometer, setOdometer] = useState('');
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const litersNum = parseFloat(liters);
    const priceNum = parseFloat(pricePerLiter);
    if (!isNaN(litersNum) && !isNaN(priceNum)) {
      setTotalCost(litersNum * priceNum);
    } else {
      setTotalCost(0);
    }
  }, [liters, pricePerLiter]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !liters || !pricePerLiter || !odometer) {
        alert("Por favor, rellena todos los campos.");
        return;
    }

    const newExpense = {
      date,
      liters: parseFloat(liters),
      pricePerLiter: parseFloat(pricePerLiter),
      totalCost,
      odometer: parseInt(odometer, 10),
    };

    onAddExpense(newExpense);
    // Reset form fields
    setDate(new Date().toISOString().split('T')[0]);
    setLiters('');
    setPricePerLiter('');
    setOdometer('');
  };

  const commonInputClasses = "w-full px-3 py-2 bg-base-200 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors";

  return (
    <div className="bg-base-100 p-6 rounded-lg shadow-2xl w-full max-w-md mx-auto relative border border-base-300">
      <button onClick={onCancel} className="absolute top-3 right-3 text-text-secondary hover:text-text-primary transition-colors">
        <CloseIcon className="w-6 h-6" />
      </button>
      <h2 className="text-xl font-bold mb-6 text-text-primary">Añadir Nuevo Registro</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-text-secondary mb-1">Fecha</label>
          <input type="date" id="date" value={date} onChange={e => setDate(e.target.value)} className={commonInputClasses} required />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="liters" className="block text-sm font-medium text-text-secondary mb-1">Litros</label>
            <input type="number" id="liters" value={liters} onChange={e => setLiters(e.target.value)} step="0.01" min="0" placeholder="e.g., 40.5" className={commonInputClasses} required />
          </div>
          <div>
            <label htmlFor="pricePerLiter" className="block text-sm font-medium text-text-secondary mb-1">Precio / Litro (€)</label>
            <input type="number" id="pricePerLiter" value={pricePerLiter} onChange={e => setPricePerLiter(e.target.value)} step="0.001" min="0" placeholder="e.g., 1.75" className={commonInputClasses} required />
          </div>
        </div>
        <div>
          <label htmlFor="odometer" className="block text-sm font-medium text-text-secondary mb-1">Odómetro (km)</label>
          <input type="number" id="odometer" value={odometer} onChange={e => setOdometer(e.target.value)} min="0" placeholder="e.g., 125000" className={commonInputClasses} required />
        </div>

        <div className="pt-2">
            <div className="bg-base-200 p-3 rounded-md text-center">
                <p className="text-sm text-text-secondary">Coste Total</p>
                <p className="text-2xl font-bold text-brand-primary">
                  {totalCost.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </p>
            </div>
        </div>
        
        <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium rounded-md text-text-primary bg-base-300 hover:bg-gray-500 transition-colors">Cancelar</button>
            <button type="submit" className="flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-100 transition-colors">
              <PlusIcon className="w-5 h-5" />
              Añadir Registro
            </button>
        </div>
      </form>
    </div>
  );
};

export default ExpenseForm;