
export type PropertyCategory = {
  id: string;
  name: string;
};

export type PropertyUnit = {
  id: string;
  unitName: string;
  status: 'Occupied' | 'Vacant';
  tenantName: string;
  tenantContact: string;
  monthlyRent: number;
  paymentDueDay: number;
};

export type Property = {
  id: string;
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
  members: Record<string, string>;

  // Fields for Finished Properties
  totalInvestment: number;
  status: 'Occupied' | 'Vacant'; // For single unit properties
  monthlyRent: number;
  paymentDueDay: number;
  tenantName: string;
  tenantContact: string;
  units?: number; // Total count
  unitsList?: PropertyUnit[]; // Granular details for multi-unit

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
  unitId?: string; // Track which unit the rent is for
  unitName?: string; // Descriptive name of the unit
  tenantName: string;
  amount: number;
  paymentDate: string; // ISO date string
  dueDate: string; // ISO date string
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Credit Card' | 'System Automated';
  status: 'Paid' | 'Pending' | 'Overdue';
  monthKey: string; // e.g. "2024-05"
};

export type MaintenanceExpense = {
  id: string;
  propertyId: string;
  expenseType: 'Repair' | 'Utility' | 'Cleaning' | 'Other';
  description: string;
  amount: number;
  date: string; // ISO date string
  vendor: string;
  unitIds?: string[];
  unitNames?: string[];
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
