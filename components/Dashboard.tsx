import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, BarChart, XAxis, YAxis, Tooltip, Legend, Line, Bar, CartesianGrid } from 'recharts';
import { type ExpenseEntry } from '../types';
import { PencilIcon } from './icons';

interface DashboardProps {
  expenses: ExpenseEntry[];
  budget: number;
  onOpenBudgetModal: () => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-300 p-3 rounded-md border border-base-100 shadow-lg">
        <p className="label text-text-secondary">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }} className="intro font-semibold">
            {`${pld.name}: ${pld.value.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${pld.unit || ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const SummaryCard: React.FC<{ title: string; value: string; subtext?: string }> = ({ title, value, subtext }) => (
  <div className="bg-base-200 p-4 rounded-lg shadow-md flex-1 min-w-[200px]">
    <h3 className="text-sm font-medium text-text-secondary truncate">{title}</h3>
    <p className="text-2xl font-bold text-brand-primary mt-1">{value}</p>
    {subtext && <p className="text-xs text-text-secondary mt-1">{subtext}</p>}
  </div>
);

const BudgetCard: React.FC<{ 
    budget: number; 
    spentThisMonth: number; 
    onEditClick: () => void 
}> = ({ budget, spentThisMonth, onEditClick }) => {
    
    const percentage = budget > 0 ? Math.min((spentThisMonth / budget) * 100, 100) : 0;
    const isOverBudget = spentThisMonth > budget && budget > 0;

    return (
        <div className="bg-base-200 p-4 rounded-lg shadow-md flex-1 min-w-[280px] flex flex-col justify-between">
            <div className="flex justify-between items-start">
                <h3 className="text-sm font-medium text-text-secondary truncate">Control Mensual</h3>
                <button 
                  onClick={onEditClick} 
                  className="text-text-secondary hover:text-brand-primary transition-colors p-1 rounded-full hover:bg-base-300"
                  aria-label="Editar pressupost"
                >
                    <PencilIcon className="w-4 h-4" />
                </button>
            </div>

            <div className="flex items-end gap-1 mt-1">
                    <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-text-primary'}`}>
                    {spentThisMonth.toLocaleString('ca-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                </p>
                <p className="text-sm text-text-secondary mb-1">
                        / {budget > 0 ? budget.toLocaleString('ca-ES') : '--'}€
                </p>
            </div>

            <div className="mt-3 w-full bg-base-300 rounded-full h-2.5 overflow-hidden">
                <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-brand-primary'}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
            <p className="text-xs text-text-secondary mt-1 text-right">
                {budget > 0 
                    ? isOverBudget 
                        ? `+${(spentThisMonth - budget).toFixed(0)}€ excedent` 
                        : `${(budget - spentThisMonth).toFixed(0)}€ restants`
                    : 'Defineix un pressupost'}
            </p>
        </div>
    );
}

const Dashboard: React.FC<DashboardProps> = ({ expenses, budget, onOpenBudgetModal }) => {
  const [costChartType, setCostChartType] = useState<'bar' | 'line'>('bar');

  const chartData = useMemo(() => {
    // Reverse expenses for chart (oldest to newest)
    return [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(e => ({
      ...e,
      dateFormatted: new Date(e.date).toLocaleDateString('ca-ES', { month: 'short', day: 'numeric' }),
    }));
  }, [expenses]);
  
  const stats = useMemo(() => {
    const totalSpent = expenses.reduce((sum, e) => sum + e.totalCost, 0);
    const totalLiters = expenses.reduce((sum, e) => sum + e.liters, 0);
    
    // Calculate spent this month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const spentThisMonth = expenses
        .filter(e => {
            const d = new Date(e.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((sum, e) => sum + e.totalCost, 0);
    
    // Calculate avg price only for entries that have liters and price
    const entriesWithPrice = expenses.filter(e => e.liters > 0 && e.totalCost > 0);
    const avgPricePerLiter = entriesWithPrice.length > 0 
        ? entriesWithPrice.reduce((sum, e) => sum + (e.totalCost / e.liters), 0) / entriesWithPrice.length 
        : 0;
    
    let totalDistance = 0;
    let avgConsumption = 0;

    // Filter entries that have valid odometer readings
    const expensesWithOdometer = expenses.filter(e => e.odometer > 0).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (expensesWithOdometer.length > 1) {
        const firstOdometer = expensesWithOdometer[expensesWithOdometer.length - 1].odometer; // Oldest
        const lastOdometer = expensesWithOdometer[0].odometer; // Newest
        
        if (lastOdometer > firstOdometer) {
             totalDistance = lastOdometer - firstOdometer;
             // Liters used to cover the distance (exclude the very last fill-up as we don't know distance *after* it)
             // We need to match the odometer entries to their liters. 
             // Simplification: sum liters of all entries between first and last odometer entry (excluding the newest one).
             const relevantIds = new Set(expensesWithOdometer.slice(1).map(e => e.id)); // All except newest
             const litersForDistance = expenses.filter(e => relevantIds.has(e.id)).reduce((sum, e) => sum + e.liters, 0);
             
             if (totalDistance > 0 && litersForDistance > 0) {
                avgConsumption = (litersForDistance / totalDistance) * 100;
             }
        }
    }

    return { totalSpent, totalLiters, avgPricePerLiter, avgConsumption, totalDistance, spentThisMonth };
  }, [expenses]);

  // Determine if we should show secondary metrics based on if we have data for them
  const hasLiterData = stats.totalLiters > 0;
  const hasDistanceData = stats.totalDistance > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <BudgetCard 
            budget={budget} 
            spentThisMonth={stats.spentThisMonth} 
            onEditClick={onOpenBudgetModal} 
        />
        <SummaryCard title="Despesa Total" value={stats.totalSpent.toLocaleString('ca-ES', { style: 'currency', currency: 'EUR' })} />
        
        {hasLiterData && (
             <SummaryCard title="Preu Mitjà Est." value={`${stats.avgPricePerLiter.toFixed(3)} €/L`} />
        )}

        {hasDistanceData && (
            <SummaryCard title="Consum Mitjà" value={`${stats.avgConsumption > 0 ? stats.avgConsumption.toFixed(2) : 'N/A'}`} subtext={stats.avgConsumption > 0 ? "L / 100km" : "Necessita més dades"}/>
        )}
      </div>

      {expenses.length < 2 ? (
         <div className="bg-base-200 p-6 rounded-lg shadow-md text-center">
            <h2 className="text-lg font-semibold text-text-primary">Dades Insuficients per a Gràfics</h2>
            <p className="text-text-secondary mt-2">Necessites almenys dos registres per visualitzar les tendències.</p>
        </div>
      ) : (
        <div id="charts-section" className={`grid grid-cols-1 ${hasLiterData ? 'lg:grid-cols-2' : ''} gap-6 scroll-mt-24`}>
            <div className="bg-base-200 p-4 rounded-lg shadow-md h-80 flex flex-col order-first">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-text-primary">Cost Total per Registre (€)</h3>
                <div className="flex items-center bg-base-300 rounded-md p-0.5">
                <button
                    onClick={() => setCostChartType('bar')}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                    costChartType === 'bar' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary hover:bg-base-100/50'
                    }`}
                >
                    Barres
                </button>
                <button
                    onClick={() => setCostChartType('line')}
                    className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                    costChartType === 'line' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary hover:bg-base-100/50'
                    }`}
                >
                    Línia
                </button>
                </div>
            </div>
            <ResponsiveContainer width="100%" height="100%">
                {costChartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="dateFormatted" stroke="#d1d5db" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#d1d5db" tick={{ fontSize: 12 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}} />
                    <Bar dataKey="totalCost" name="Cost Total" fill="#3b82f6" unit="€" />
                </BarChart>
                ) : (
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="dateFormatted" stroke="#d1d5db" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#d1d5db" tick={{ fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(value) => value.toFixed(0)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}} />
                    <Line type="monotone" dataKey="totalCost" name="Cost Total" stroke="#60a5fa" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} unit="€" />
                </LineChart>
                )}
            </ResponsiveContainer>
            </div>

            {hasLiterData && (
                <div className="bg-base-200 p-4 rounded-lg shadow-md h-80">
                <h3 className="font-semibold text-text-primary mb-4">Evolució del Preu per Litre (€)</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.filter(d => d.pricePerLiter > 0)} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="dateFormatted" stroke="#d1d5db" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#d1d5db" tick={{ fontSize: 12 }} domain={['dataMin - 0.05', 'dataMax + 0.05']} tickFormatter={(value) => value.toFixed(2)} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}} />
                    <Line type="monotone" dataKey="pricePerLiter" name="Preu/Litre" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} unit="€" />
                    </LineChart>
                </ResponsiveContainer>
                </div>
            )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;