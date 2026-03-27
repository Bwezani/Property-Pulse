
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
  isAirbnb?: boolean;
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
  isAirbnb?: boolean;

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
  tenantName: string; // Used for Guest name if Airbnb
  amount: number; // For Airbnb: Amount PAID towards the booking (often just a deposit initially)
  paymentDate: string; // ISO date string
  dueDate: string; // ISO date string
  paymentMethod: 'Bank Transfer' | 'Cash' | 'Credit Card' | 'System Automated';
  status: 'Paid' | 'Pending' | 'Overdue' | 'Partial Deposit'; // Added Partial Deposit for Airbnb
  monthKey: string; // e.g. "2024-05"
  
  // Airbnb Booking extensions
  isAirbnbBooking?: boolean;
  totalBookingCost?: number; // Total value of the reservation
  balanceDue?: number; // How much is left to be paid
  checkInDate?: string; // ISO date string
  checkOutDate?: string; // ISO date string
  contactNumber?: string; // Guest phone number
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
    itemName: string;
    category: string;
    estimatedCost: number;
    actualCost?: number;
    propertyId: string;
    userId: string;
};

export type Vendor = {
  id: string;
  name: string;
  contact: string;
  serviceCategory: string;
  userId: string;
  createdAt: string; // ISO date string
};

