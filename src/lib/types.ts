export type PropertyCategory = {
  id: string;
  name: string;
};

export type Property = {
  id:string;
  name: string;
  code: string;
  categoryId: string;
  location: string;
  size: string;
  description: string;
  type: 'Finished' | 'Under Construction';
  imageId: string;
  createdAt: string; // ISO date string
  isDeleted: boolean;

  // Fields for Finished Properties
  totalInvestment: number;
  status: 'Occupied' | 'Vacant';
  monthlyRent: number;
  paymentDueDay: number;
  tenantName: string;
  tenantContact: string;

  // Fields for Under Construction Properties
  constructionStage: 'Planning' | 'Foundation' | 'Framing' | 'Roofing' | 'Finishing' | 'Completed';
  estimatedBudget?: number;

  // Auto-calculated fields
  totalConstructionCost: number;
  totalRentReceived: number;
  totalMaintenanceCost: number;
  remainingInvestment: number;
  totalProfit: number;
  netProfit: number;
  
  // AI Feature
  costOverrunAlert?: string;
};

export type ConstructionExpense = {
  id: string;
  propertyId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  vendor: string;
  purchaseDate: string; // ISO date string
  notes?: string;
};

export type RentalIncome = {
  id: string;
  propertyId: string;
  tenantName: string;
  amount: number;
  paymentDate: string; // ISO date string
  dueDate: string; // ISO date string
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Credit Card';
  status: 'Paid' | 'Pending' | 'Overdue';
};

export type MaintenanceExpense = {
  id: string;
  propertyId: string;
  expenseType: 'Repair' | 'Utility' | 'Cleaning' | 'Other';
  description: string;
  amount: number;
  date: string; // ISO date string
  vendor: string;
};

export type ConstructionBudgetItem = {
  id: string;
  propertyId: string;
  itemName: string;
  category: string;
  estimatedCost: number;
  actualCost: number;
};

export type MaintenanceBudgetItem = {
  id: string;
  propertyId: string;
  itemName: string;
  category: string;
  estimatedCost: number;
  actualCost: number;
};
