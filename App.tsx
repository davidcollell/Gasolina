
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { type ExpenseEntry } from './types';
import ExpenseForm from './components/ExpenseForm';
import ExpenseHistory from './components/ExpenseHistory';
import Dashboard from './components/Dashboard';
import { CarIcon, ExclamationTriangleIcon, ArrowDownTrayIcon, EllipsisVerticalIcon, CurrencyEuroIcon, ChartBarIcon, CloseIcon, CheckIcon } from './components/icons';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  const [budget, setBudget] = useState<number>(0);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [showFormContent, setShowFormContent] = useState(false);
  
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState<number | null>(null);
  
  // Menu and Modals
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem('gasExpenses');
      const storedBudget = localStorage.getItem('gasBudget');
      
      if (storedExpenses) {
        const parsedExpenses = JSON.parse(storedExpenses) as any[];
        const migratedExpenses = parsedExpenses.map(expense => {
            if (typeof expense === 'object' && expense !== null && !('vehicleId' in expense)) {
                return { ...expense, vehicleId: 1 };
            }
            return expense;
        });
        setExpenses((migratedExpenses as ExpenseEntry[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }

      if (storedBudget) {
        setBudget(parseFloat(storedBudget));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('gasExpenses', JSON.stringify(expenses));
    } catch (error) {
      console.error("Failed to save expenses to localStorage", error);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('gasBudget', budget.toString());
    } catch (error) {
      console.error("Failed to save budget to localStorage", error);
    }
  }, [budget]);


  useEffect(() => {
    if (isFormVisible) {
      const timer = setTimeout(() => setShowFormContent(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isFormVisible]);

   useEffect(() => {
    if (expenseToDelete !== null) {
      const timer = setTimeout(() => setShowDeleteConfirm(true), 50);
      return () => clearTimeout(timer);
    }
  }, [expenseToDelete]);
  
  useEffect(() => {
    if (newlyAddedId) {
      const timer = setTimeout(() => {
        setNewlyAddedId(null);
      }, 2000); 
      return () => clearTimeout(timer);
    }
  }, [newlyAddedId]);

  const handleOpenForm = () => {
    setIsFormVisible(true);
  };

  const handleCloseForm = () => {
    setShowFormContent(false);
    setTimeout(() => {
      setIsFormVisible(false);
    }, 300); 
  };
  
  const handleInitiateDelete = (id: number) => {
    setExpenseToDelete(id);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setTimeout(() => {
      setExpenseToDelete(null);
    }, 300);
  };
  
  const handleConfirmDelete = () => {
    if (expenseToDelete !== null) {
      deleteExpense(expenseToDelete);
      handleCancelDelete();
    }
  };

  const addExpense = (newExpense: Omit<ExpenseEntry, 'id' | 'vehicleId'>) => {
    const newId = Date.now();
    setExpenses(prevExpenses => 
      [...prevExpenses, { ...newExpense, id: newId, vehicleId: 1 }]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
    setNewlyAddedId(newId);
    handleCloseForm();
  };

  const deleteExpense = (id: number) => {
    setExpenses(prevExpenses => prevExpenses.filter(expense => expense.id !== id));
  };

  const sortedExpenses = useMemo(() => {
    return [...expenses].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [expenses]);

  // Menu Actions
  const handleOpenBudgetModal = () => {
    setShowBudgetModal(true);
    setIsMenuOpen(false);
  };

  const handleScrollToCharts = () => {
    setIsMenuOpen(false);
    const element = document.getElementById('charts-section');
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <header className="bg-base-200/80 backdrop-blur-sm shadow-lg sticky top-0 z-20 safe-area-top">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CarIcon className="w-8 h-8 text-brand-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Control de Benzina
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             {showInstallButton && (
                <button
                  onClick={handleInstallClick}
                  className="hidden sm:inline-flex items-center justify-center gap-2 px-3 py-2 border border-brand-primary text-sm font-medium rounded-md text-brand-primary bg-transparent hover:bg-brand-primary/10 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Instal·lar App</span>
                </button>
            )}
            <button
                onClick={handleOpenForm}
                className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-100 transition-colors"
            >
                Afegir Registre
            </button>
            
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-full hover:bg-base-300 text-text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-brand-primary"
                    aria-label="Menú"
                >
                    <EllipsisVerticalIcon className="w-6 h-6" />
                </button>

                {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-md shadow-xl bg-base-200 ring-1 ring-black ring-opacity-5 focus:outline-none z-30 overflow-hidden">
                        <div className="py-1">
                            <button
                                onClick={handleOpenBudgetModal}
                                className="w-full text-left px-4 py-3 text-sm text-text-primary hover:bg-base-300 flex items-center gap-2"
                            >
                                <CurrencyEuroIcon className="w-5 h-5 text-brand-primary" />
                                Pressupost mensual
                            </button>
                             {/* Only show charts option if there is enough data for charts */}
                             {expenses.length >= 2 && (
                                <button
                                    onClick={handleScrollToCharts}
                                    className="w-full text-left px-4 py-3 text-sm text-text-primary hover:bg-base-300 flex items-center gap-2 border-t border-base-300"
                                >
                                    <ChartBarIcon className="w-5 h-5 text-brand-primary" />
                                    Gràfics
                                </button>
                             )}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 safe-area-bottom">
        
        {/* Budget Modal */}
        {showBudgetModal && (
            <BudgetModal 
                currentBudget={budget} 
                onSave={(newBudget) => {
                    setBudget(newBudget);
                    setShowBudgetModal(false);
                }}
                onClose={() => setShowBudgetModal(false)}
            />
        )}

        {isFormVisible && (
          <div 
            className={`fixed inset-0 bg-black/60 z-40 flex items-center justify-center transition-opacity duration-300 ${showFormContent ? 'opacity-100' : 'opacity-0'}`} 
            onClick={handleCloseForm}>
            <div 
              onClick={e => e.stopPropagation()}
              className={`transition-all duration-300 transform ${showFormContent ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <ExpenseForm onAddExpense={addExpense} onCancel={handleCloseForm} />
            </div>
          </div>
        )}

        {expenseToDelete !== null && (
           <div 
            className={`fixed inset-0 bg-black/60 z-50 flex items-center justify-center transition-opacity duration-300 ${showDeleteConfirm ? 'opacity-100' : 'opacity-0'}`} 
            onClick={handleCancelDelete}>
            <div 
              onClick={e => e.stopPropagation()}
              className={`bg-base-100 rounded-lg shadow-2xl w-full max-w-sm mx-auto p-6 border border-base-300 transition-all duration-300 transform ${showDeleteConfirm ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
            >
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-500/10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
                </div>
                <h3 className="mt-5 text-lg font-medium leading-6 text-text-primary">Eliminar Registre</h3>
                <div className="mt-2 px-4 text-sm">
                    <p className="text-text-secondary">
                        ¿Estàs segur que vols eliminar aquest registre? Aquesta acció no es pot desfer.
                    </p>
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm font-medium rounded-md text-text-primary bg-base-300 hover:bg-gray-500 transition-colors"
                >
                  Cancel·lar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-base-100"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        )}

        {expenses.length > 0 || budget > 0 ? (
          <div className="space-y-8">
            <div className="animate-fadeInUp" style={{ animationDelay: '150ms' }}>
              <Dashboard 
                expenses={sortedExpenses} 
                budget={budget} 
                onOpenBudgetModal={() => setShowBudgetModal(true)} 
            />
            </div>
            <div className="animate-fadeInUp" style={{ animationDelay: '300ms' }}>
              <ExpenseHistory expenses={expenses} onInitiateDelete={handleInitiateDelete} newlyAddedId={newlyAddedId} />
            </div>
          </div>
        ) : (
          <div className="text-center py-20 px-6 bg-base-200 rounded-lg shadow-md animate-fadeInUp" style={{ animationDelay: '150ms' }}>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">Sense registres!</h2>
            <p className="text-text-secondary mb-6">Encara no has afegit cap registre. <br/> Fes clic al botó per començar.</p>
            <button
              onClick={handleOpenForm}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-100 transition-colors"
            >
              Afegir Primer Registre
            </button>
          </div>
        )}
      </main>
      
      <div className="fixed bottom-6 right-6 md:hidden z-10">
         <button
            onClick={handleOpenForm}
            className="w-14 h-14 rounded-full bg-brand-primary hover:bg-brand-secondary text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            aria-label="Afegir Registre"
          >
            <svg xmlns="http://www.w.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
      </div>

    </div>
  );
};

// Subcomponent for Budget Modal
const BudgetModal: React.FC<{ 
    currentBudget: number; 
    onSave: (val: number) => void; 
    onClose: () => void; 
}> = ({ currentBudget, onSave, onClose }) => {
    const [value, setValue] = useState(currentBudget.toString());

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const num = parseFloat(value);
        if (!isNaN(num) && num >= 0) {
            onSave(num);
        } else {
            onSave(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4" onClick={onClose}>
            <div 
                className="bg-base-100 rounded-lg shadow-2xl w-full max-w-sm p-6 border border-base-300 relative animate-fadeInUp"
                onClick={e => e.stopPropagation()}
            >
                 <button onClick={onClose} className="absolute top-3 right-3 text-text-secondary hover:text-text-primary transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
                <h3 className="text-xl font-bold text-text-primary mb-4">Definir Pressupost Mensual</h3>
                <p className="text-sm text-text-secondary mb-4">Introdueix el límit de despesa mensual desitjat.</p>
                
                <form onSubmit={handleSubmit}>
                    <div className="relative mb-6">
                        <input 
                            type="number" 
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-4 py-2 pl-10 bg-base-200 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-primary text-text-primary"
                            placeholder="0.00"
                            autoFocus
                            min="0"
                            step="0.01"
                        />
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span className="text-text-secondary">€</span>
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium rounded-md text-text-primary bg-base-300 hover:bg-gray-500 transition-colors"
                        >
                            Cancel·lar
                        </button>
                        <button 
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-100"
                        >
                            <CheckIcon className="w-4 h-4" />
                            Desar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default App;
