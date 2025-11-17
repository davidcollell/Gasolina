
export interface ExpenseEntry {
  id: number;
  vehicleId: number;
  date: string;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  odometer: number;
}
