
import React, { useState, useEffect, useMemo } from 'react';
import { type ExpenseEntry } from './types';
import ExpenseForm from './components/ExpenseForm';
import ExpenseHistory from './components/ExpenseHistory';
import Dashboard from './components/Dashboard';
import { CarIcon, ExclamationTriangleIcon, ArrowDownTrayIcon } from './components/icons';

const App: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseEntry[]>([]);
  
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [showFormContent, setShowFormContent] = useState(false);
  
  const [expenseToDelete, setExpenseToDelete] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newlyAddedId, setNewlyAddedId] = useState<number | null>(null);
  
  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setShowInstallButton(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    // Show the install prompt
    deferredPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    // We've used the prompt, and can't use it again, discard it
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  useEffect(() => {
    try {
      const storedExpenses = localStorage.getItem('gasExpenses');
      if (storedExpenses) {
        // FIX: Cast to any[] and use type guards for safer data migration from localStorage.
        // This prevents the "Spread types may only be created from object types" error.
        const parsedExpenses = JSON.parse(storedExpenses) as any[];
        
        // Ensure all expenses have a vehicleId for data consistency, even if not used in UI
        const migratedExpenses = parsedExpenses.map(expense => {
            if (typeof expense === 'object' && expense !== null && !('vehicleId' in expense)) {
                return { ...expense, vehicleId: 1 };
            }
            return expense;
        });
        setExpenses((migratedExpenses as ExpenseEntry[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
    // This effect will run whenever a new expense is added.
    if (newlyAddedId) {
      const timer = setTimeout(() => {
        setNewlyAddedId(null);
      }, 2000); // Reset after 2 seconds to remove highlight
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

  return (
    <div className="min-h-screen bg-base-100 font-sans">
      <header className="bg-base-200/80 backdrop-blur-sm shadow-lg sticky top-0 z-10 safe-area-top">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <CarIcon className="w-8 h-8 text-brand-primary" />
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
              Control de Gasolina
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
             {showInstallButton && (
                <button
                  onClick={handleInstallClick}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-brand-primary text-sm font-medium rounded-md text-brand-primary bg-transparent hover:bg-brand-primary/10 transition-colors"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  <span className="hidden sm:inline">Instalar App</span>
                </button>
            )}
            <button
                onClick={handleOpenForm}
                className="hidden md:inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-100 transition-colors"
            >
                Añadir Registro
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8 safe-area-bottom">
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
                <h3 className="mt-5 text-lg font-medium leading-6 text-text-primary">Eliminar Registro</h3>
                <div className="mt-2 px-4 text-sm">
                    <p className="text-text-secondary">
                        ¿Estás seguro de que quieres eliminar este registro? Esta acción no se puede deshacer.
                    </p>
                </div>
              </div>
              <div className="mt-6 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="px-4 py-2 text-sm font-medium rounded-md text-text-primary bg-base-300 hover:bg-gray-500 transition-colors"
                >
                  Cancelar
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

        {expenses.length > 0 ? (
          <div className="space-y-8">
            <div className="animate-fadeInUp" style={{ animationDelay: '150ms' }}>
              <Dashboard expenses={sortedExpenses} />
            </div>
            <div className="animate-fadeInUp" style={{ animationDelay: '300ms' }}>
              <ExpenseHistory expenses={expenses} onInitiateDelete={handleInitiateDelete} newlyAddedId={newlyAddedId} />
            </div>
          </div>
        ) : (
          <div className="text-center py-20 px-6 bg-base-200 rounded-lg shadow-md animate-fadeInUp" style={{ animationDelay: '150ms' }}>
            <h2 className="text-2xl font-semibold text-text-primary mb-2">¡Sin registros!</h2>
            <p className="text-text-secondary mb-6">Aún no has añadido ningún registro. <br/> Haz clic en el botón para empezar.</p>
            <button
              onClick={handleOpenForm}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-brand-primary hover:bg-brand-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary focus:ring-offset-base-100 transition-colors"
            >
              Añadir Primer Registro
            </button>
          </div>
        )}
      </main>
      
      <div className="fixed bottom-6 right-6 md:hidden">
         <button
            onClick={handleOpenForm}
            className="w-14 h-14 rounded-full bg-brand-primary hover:bg-brand-secondary text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105"
            aria-label="Añadir Registro"
          >
            <svg xmlns="http://www.w.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
      </div>

    </div>
  );
};

export default App;
