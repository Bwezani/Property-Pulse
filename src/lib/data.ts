import type {
  Property,
  PropertyCategory,
  ConstructionExpense,
  RentalIncome,
  MaintenanceExpense,
} from './types';
import { PlaceHolderImagesMap } from './placeholder-images';

let categories: PropertyCategory[] = [
  { id: 'cat-1', name: 'Residential' },
  { id: 'cat-2', name: 'Commercial' },
  { id: 'cat-3', name: 'Mixed-Use' },
];

let properties: Property[] = [
  {
    id: 'prop-1',
    name: 'Greenwood Villa',
    code: 'GWV-001',
    categoryId: 'cat-1',
    location: 'Maple Creek, Suburbia',
    size: '2400 sqft',
    description: 'A spacious family home with a modern design and a large backyard.',
    type: 'Finished',
    imageId: 'prop-1-img',
    createdAt: '2022-08-15T10:00:00Z',
    isDeleted: false,
    totalInvestment: 250000,
    status: 'Occupied',
    monthlyRent: 2200,
    paymentDueDay: 1,
    tenantName: 'John Doe',
    tenantContact: 'john.doe@email.com',
    constructionStage: 'Completed',
    totalConstructionCost: 0,
    totalRentReceived: 0,
    totalMaintenanceCost: 0,
    remainingInvestment: 0,
    totalProfit: 0,
    netProfit: 0,
  },
  {
    id: 'prop-2',
    name: 'Oakside Apartments',
    code: 'OKA-002',
    categoryId: 'cat-1',
    location: 'Downtown, Metro City',
    size: '12-unit building',
    description: 'Modern apartment building in the heart of the city.',
    type: 'Under Construction',
    imageId: 'prop-2-img',
    createdAt: '2023-05-20T14:30:00Z',
    isDeleted: false,
    totalInvestment: 0,
    status: 'Vacant',
    monthlyRent: 0,
    paymentDueDay: 0,
    tenantName: '',
    tenantContact: '',
    constructionStage: 'Framing',
    estimatedBudget: 1200000,
    totalConstructionCost: 0,
    totalRentReceived: 0,
    totalMaintenanceCost: 0,
    remainingInvestment: 0,
    totalProfit: 0,
    netProfit: 0,
  },
  {
    id: 'prop-3',
    name: 'The Commerce Hub',
    code: 'TCH-001',
    categoryId: 'cat-2',
    location: 'Business District, Metro City',
    size: '5000 sqft Office Space',
    description: 'Prime commercial property with high foot traffic.',
    type: 'Finished',
    imageId: 'prop-3-img',
    createdAt: '2021-11-01T09:00:00Z',
    isDeleted: false,
    totalInvestment: 750000,
    status: 'Occupied',
    monthlyRent: 8000,
    paymentDueDay: 5,
    tenantName: 'Innovate Corp',
    tenantContact: 'contact@innovatecorp.com',
    constructionStage: 'Completed',
    totalConstructionCost: 0,
    totalRentReceived: 0,
    totalMaintenanceCost: 0,
    remainingInvestment: 0,
    totalProfit: 0,
    netProfit: 0,
    costOverrunAlert:
      'Overrun detected due to "unexpected repair" on the HVAC system, increasing maintenance costs.',
  },
  {
    id: 'prop-4',
    name: 'Lakeside Retail',
    code: 'LKR-004',
    categoryId: 'cat-2',
    location: 'Lakeside View',
    size: 'Complex of 5 retail shops',
    description: 'A new retail complex under development with scenic lake views.',
    type: 'Under Construction',
    imageId: 'prop-4-img',
    createdAt: '2024-01-10T11:00:00Z',
    isDeleted: false,
    totalInvestment: 0,
    status: 'Vacant',
    monthlyRent: 0,
    paymentDueDay: 0,
    tenantName: '',
    tenantContact: '',
    constructionStage: 'Foundation',
    estimatedBudget: 850000,
    totalConstructionCost: 0,
    totalRentReceived: 0,
    totalMaintenanceCost: 0,
    remainingInvestment: 0,
    totalProfit: 0,
    netProfit: 0,
  },
  {
    id: 'prop-5',
    name: 'Cedar Heights',
    code: 'CDH-005',
    categoryId: 'cat-1',
    location: 'Hilltop, Suburbia',
    size: '1800 sqft',
    description: 'Cozy home with a rustic charm and city views. Investment recovery is complete.',
    type: 'Finished',
    imageId: 'prop-5-img',
    createdAt: '2020-02-20T16:00:00Z',
    isDeleted: false,
    totalInvestment: 180000,
    status: 'Occupied',
    monthlyRent: 1600,
    paymentDueDay: 1,
    tenantName: 'Jane Smith',
    tenantContact: 'jane.s@email.com',
    constructionStage: 'Completed',
    totalConstructionCost: 0,
    totalRentReceived: 0,
    totalMaintenanceCost: 0,
    remainingInvestment: 0,
    totalProfit: 0,
    netProfit: 0,
  },
];

let constructionExpenses: ConstructionExpense[] = [
  // Expenses for Oakside Apartments (prop-2)
  { id: 'cex-1', propertyId: 'prop-2', itemName: 'Concrete', quantity: 200, unitPrice: 150, totalPrice: 30000, vendor: 'BuildIt Concrete', purchaseDate: '2023-06-01T00:00:00Z' },
  { id: 'cex-2', propertyId: 'prop-2', itemName: 'Steel Beams', quantity: 50, unitPrice: 500, totalPrice: 25000, vendor: 'MetalWorks Inc.', purchaseDate: '2023-07-10T00:00:00Z' },
  { id: 'cex-3', propertyId: 'prop-2', itemName: 'Lumber', quantity: 1000, unitPrice: 12, totalPrice: 12000, vendor: 'Timber Co.', purchaseDate: '2023-08-22T00:00:00Z' },

  // Expenses for Lakeside Retail (prop-4)
  { id: 'cex-4', propertyId: 'prop-4', itemName: 'Foundation Pouring Service', quantity: 1, unitPrice: 45000, totalPrice: 45000, vendor: 'Solid Foundations', purchaseDate: '2024-02-15T00:00:00Z' },
];

let rentalIncomes: RentalIncome[] = [
  // Incomes for Greenwood Villa (prop-1)
  { id: 'rin-1', propertyId: 'prop-1', tenantName: 'John Doe', amount: 2200, paymentDate: '2023-12-01T00:00:00Z', dueDate: '2023-12-01T00:00:00Z', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: 'rin-2', propertyId: 'prop-1', tenantName: 'John Doe', amount: 2200, paymentDate: '2024-01-01T00:00:00Z', dueDate: '2024-01-01T00:00:00Z', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: 'rin-3', propertyId: 'prop-1', tenantName: 'John Doe', amount: 2200, paymentDate: '2024-02-01T00:00:00Z', dueDate: '2024-02-01T00:00:00Z', paymentMethod: 'Bank Transfer', status: 'Paid' },

  // Incomes for The Commerce Hub (prop-3)
  { id: 'rin-4', propertyId: 'prop-3', tenantName: 'Innovate Corp', amount: 8000, paymentDate: '2024-01-05T00:00:00Z', dueDate: '2024-01-05T00:00:00Z', paymentMethod: 'Bank Transfer', status: 'Paid' },
  { id: 'rin-5', propertyId: 'prop-3', tenantName: 'Innovate Corp', amount: 8000, paymentDate: '2024-02-05T00:00:00Z', dueDate: '2024-02-05T00:00:00Z', paymentMethod: 'Bank Transfer', status: 'Paid' },
  
  // Incomes for Cedar Heights (prop-5) - to show profit
  ...Array.from({ length: 18 }, (_, i) => ({
    id: `rin-ch-${i}`,
    propertyId: 'prop-5',
    tenantName: 'Jane Smith',
    amount: 1600,
    paymentDate: new Date(2022, i, 1).toISOString(),
    dueDate: new Date(2022, i, 1).toISOString(),
    paymentMethod: 'Bank Transfer' as const,
    status: 'Paid' as const,
  })),
];

let maintenanceExpenses: MaintenanceExpense[] = [
  { id: 'mex-1', propertyId: 'prop-1', expenseType: 'Repair', description: 'Leaky faucet fix', amount: 150, date: '2024-01-20T00:00:00Z', vendor: 'Plumb Perfect' },
  { id: 'mex-2', propertyId: 'prop-3', expenseType: 'Utility', description: 'Monthly electricity bill', amount: 450, date: '2024-02-10T00:00:00Z', vendor: 'City Power' },
  { id: 'mex-3', propertyId: 'prop-3', expenseType: 'Repair', description: 'Unexpected repair on HVAC system', amount: 1200, date: '2024-02-15T00:00:00Z', vendor: 'Cooling Systems Inc' },
];

// --- Data Access Functions ---

export const getProperties = async () => properties.filter(p => !p.isDeleted);
export const getPropertyById = async (id: string) => properties.find(p => p.id === id && !p.isDeleted);
export const getCategories = async () => categories;
export const getConstructionExpenses = async (propertyId: string) => constructionExpenses.filter(e => e.propertyId === propertyId);
export const getRentalIncomes = async (propertyId: string) => rentalIncomes.filter(i => i.propertyId === propertyId);
export const getMaintenanceExpenses = async (propertyId: string) => maintenanceExpenses.filter(e => e.propertyId === propertyId);

export const getAllConstructionExpenses = async () => constructionExpenses;
export const getAllRentalIncomes = async () => rentalIncomes;
export const getAllMaintenanceExpenses = async () => maintenanceExpenses;


export const addProperty = async (property: Omit<Property, 'id' | 'isDeleted' | 'createdAt'>) => {
    const newProperty: Property = {
        ...property,
        id: `prop-${Date.now()}`,
        isDeleted: false,
        createdAt: new Date().toISOString(),
    };
    properties.push(newProperty);
    return newProperty;
};

export const updateProperty = async (id: string, updates: Partial<Property>) => {
    properties = properties.map(p => p.id === id ? { ...p, ...updates } : p);
    return properties.find(p => p.id === id);
}

export const deleteProperty = async (id: string) => {
    properties = properties.map(p => p.id === id ? { ...p, isDeleted: true } : p);
    return true;
}

export const addConstructionExpense = async (expense: Omit<ConstructionExpense, 'id'>) => {
    const newExpense = { ...expense, id: `cex-${Date.now()}` };
    constructionExpenses.push(newExpense);
    return newExpense;
}

export const addMaintenanceExpense = async (expense: Omit<MaintenanceExpense, 'id'>) => {
    const newExpense = { ...expense, id: `mex-${Date.now()}` };
    maintenanceExpenses.push(newExpense);
    return newExpense;
}

export const updatePropertyCostOverrunAlert = async (propertyId: string, reason: string) => {
    properties = properties.map(p => p.id === propertyId ? { ...p, costOverrunAlert: reason } : p);
    return true;
}
