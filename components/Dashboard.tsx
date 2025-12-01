
import React, { useMemo, useState } from 'react';
import { ResponsiveContainer, LineChart, BarChart, XAxis, YAxis, Tooltip, Legend, Line, Bar, CartesianGrid } from 'recharts';
import { type ExpenseEntry } from '../types';

interface DashboardProps {
  expenses: ExpenseEntry[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-base-300 p-3 rounded-md border border-base-100 shadow-lg">
        <p className="label text-text-secondary">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }} className="intro font-semibold">
            {`${pld.name}: ${pld.value.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${pld.unit || ''}`}
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

const Dashboard: React.FC<DashboardProps> = ({ expenses }) => {
  const [costChartType, setCostChartType] = useState<'bar' | 'line'>('bar');

  const chartData = useMemo(() => {
    // Reverse expenses for chart (oldest to newest)
    return [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(e => ({
      ...e,
      dateFormatted: new Date(e.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
    }));
  }, [expenses]);
  
  const stats = useMemo(() => {
    if (expenses.length === 0) {
      return { totalSpent: 0, totalLiters: 0, avgPricePerLiter: 0, avgConsumption: 0, totalDistance: 0 };
    }
    const totalSpent = expenses.reduce((sum, e) => sum + e.totalCost, 0);
    const totalLiters = expenses.reduce((sum, e) => sum + e.liters, 0);
    
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

    return { totalSpent, totalLiters, avgPricePerLiter, avgConsumption, totalDistance };
  }, [expenses]);

  if (expenses.length < 2) {
    return (
      <div className="bg-base-200 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-lg font-semibold text-text-primary">Datos Insuficientes para Gráficos</h2>
        <p className="text-text-secondary mt-2">Necesitas al menos dos registros para visualizar las tendencias.</p>
      </div>
    );
  }

  // Determine if we should show secondary metrics based on if we have data for them
  const hasLiterData = stats.totalLiters > 0;
  const hasDistanceData = stats.totalDistance > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4">
        <SummaryCard title="Gasto Total" value={stats.totalSpent.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} />
        {hasLiterData ? (
             <SummaryCard title="Litros Totales" value={`${stats.totalLiters.toFixed(2)} L`} />
        ) : (
             <SummaryCard title="Registros" value={`${expenses.length}`} subtext="Total entradas" />
        )}
        
        {hasLiterData && (
             <SummaryCard title="Precio Medio Est." value={`${stats.avgPricePerLiter.toFixed(3)} €/L`} />
        )}

        {hasDistanceData && (
            <SummaryCard title="Consumo Medio" value={`${stats.avgConsumption > 0 ? stats.avgConsumption.toFixed(2) : 'N/A'}`} subtext={stats.avgConsumption > 0 ? "L / 100km" : "Necesita más datos"}/>
        )}
      </div>

      <div className={`grid grid-cols-1 ${hasLiterData ? 'lg:grid-cols-2' : ''} gap-6`}>
        <div className="bg-base-200 p-4 rounded-lg shadow-md h-80 flex flex-col order-first">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-text-primary">Coste Total por Registro (€)</h3>
            <div className="flex items-center bg-base-300 rounded-md p-0.5">
              <button
                onClick={() => setCostChartType('bar')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  costChartType === 'bar' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary hover:bg-base-100/50'
                }`}
              >
                Barras
              </button>
              <button
                onClick={() => setCostChartType('line')}
                className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
                  costChartType === 'line' ? 'bg-brand-primary text-white shadow' : 'text-text-secondary hover:bg-base-100/50'
                }`}
              >
                Línea
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
                <Bar dataKey="totalCost" name="Coste Total" fill="#10b981" unit="€" />
              </BarChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="dateFormatted" stroke="#d1d5db" tick={{ fontSize: 12 }} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 12 }} domain={['dataMin - 5', 'dataMax + 5']} tickFormatter={(value) => value.toFixed(0)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}} />
                <Line type="monotone" dataKey="totalCost" name="Coste Total" stroke="#34d399" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} unit="€" />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>

        {hasLiterData && (
            <div className="bg-base-200 p-4 rounded-lg shadow-md h-80">
            <h3 className="font-semibold text-text-primary mb-4">Evolución del Precio por Litro (€)</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.filter(d => d.pricePerLiter > 0)} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="dateFormatted" stroke="#d1d5db" tick={{ fontSize: 12 }} />
                <YAxis stroke="#d1d5db" tick={{ fontSize: 12 }} domain={['dataMin - 0.05', 'dataMax + 0.05']} tickFormatter={(value) => value.toFixed(2)} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{fontSize: "14px", paddingTop: "20px"}} />
                <Line type="monotone" dataKey="pricePerLiter" name="Precio/Litro" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} unit="€" />
                </LineChart>
            </ResponsiveContainer>
            </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
