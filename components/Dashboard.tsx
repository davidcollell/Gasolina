
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, BarChart, XAxis, YAxis, Tooltip, Legend, Line, Bar, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
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
    
    // Estat quan no hi ha pressupost definit
    if (budget <= 0) {
        return (
            <div className="bg-base-200 p-4 rounded-lg shadow-md flex-1 min-w-[280px] flex flex-col justify-between min-h-[160px]">
                <div className="flex justify-between items-start">
                    <h3 className="text-sm font-medium text-text-secondary truncate">Control Mensual</h3>
                </div>
                
                <div className="flex flex-col items-center justify-center flex-grow py-2 text-center space-y-3">
                    <p className="text-sm text-text-secondary">
                        Defineix un límit per controlar la teva despesa mensual.
                    </p>
                    <button 
                        onClick={onEditClick}
                        className="px-4 py-2 bg-brand-primary text-white text-sm font-medium rounded-md hover:bg-brand-secondary transition-colors shadow-sm"
                    >
                        Definir Pressupost
                    </button>
                </div>
            </div>
        );
    }

    // Estat normal amb pressupost
    const percentage = Math.min((spentThisMonth / budget) * 100, 100);
    const isOverBudget = spentThisMonth > budget;
    const remaining = Math.max(budget - spentThisMonth, 0);

    const data = [
        { name: 'Gastat', value: spentThisMonth },
        { name: 'Restant', value: remaining > 0 ? remaining : 0 }
    ];

    // Calcular color dinàmic (HSL) de Verd (120) a Vermell (0)
    // 0% -> 120
    // 100% -> 0
    const hue = Math.max(0, 120 * (1 - percentage / 100));
    // S'utilitza 75% saturació i 45% lluminositat per colors vibrants però llegibles
    const dynamicColor = `hsl(${hue}, 75%, 45%)`;
    
    return (
        <div className="bg-base-200 p-4 rounded-lg shadow-md flex-1 min-w-[280px] flex flex-col justify-between min-h-[160px]">
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

            <div className="flex items-center justify-between mt-2 flex-grow">
                 <div className="flex flex-col justify-center">
                    <div className="flex items-baseline gap-1.5">
                        <p className={`text-2xl font-bold ${isOverBudget ? 'text-red-500' : 'text-text-primary'}`}>
                            {spentThisMonth.toLocaleString('ca-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}€
                        </p>
                        <p className="text-sm text-text-secondary">
                                / {budget.toLocaleString('ca-ES')}€
                        </p>
                    </div>
                     <p className="text-xs text-text-secondary mt-1">
                        {isOverBudget 
                            ? `+${(spentThisMonth - budget).toFixed(0)}€ excedent` 
                            : `${(budget - spentThisMonth).toFixed(0)}€ restants`
                        }
                    </p>
                 </div>

                 <div className="w-24 h-24 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={40}
                                startAngle={90}
                                endAngle={-270}
                                dataKey="value"
                                stroke="none"
                            >
                                <Cell 
                                    key="cell-spent" 
                                    fill={isOverBudget ? "#ef4444" : dynamicColor} 
                                />
                                <Cell key="cell-remaining" fill="#374151" />
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Centered Percentage Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span 
                            className={`text-xs font-bold ${isOverBudget ? 'text-red-500' : 'text-text-primary'} animate-popIn`} 
                            style={{ color: isOverBudget ? undefined : dynamicColor }}
                        >
                            {percentage.toFixed(0)}%
                        </span>
                    </div>
                 </div>
            </div>
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
