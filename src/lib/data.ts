
import type {
  Property,
  PropertyCategory,
  ConstructionExpense,
  RentalIncome,
  MaintenanceExpense,
  ConstructionBudgetItem,
  MaintenanceBudgetItem,
} from './types';

let categories: PropertyCategory[] = [
  { id: 'stand-alone', name: 'Stand Alone' },
  { id: 'apartment', name: 'Apartment' },
  { id: 'flat', name: 'Flat' },
  { id: 'bedsit', name: 'Bedsit' },
  { id: 'commercial', name: 'Commercial Space' },
  { id: 'warehouse', name: 'Warehouse' },
  { id: 'other', name: 'Other' },
];

let properties: Property[] = [
  {
    id: 'prop-1',
    name: 'Greenwood Villa',
    code: 'GWV-001',
    categoryId: 'stand-alone',
    location: 'Maple Creek, Suburbia',
    size: '2400 sqft',
    description: 'A spacious family home with a modern design and a large backyard.',
    type: 'Finished',
    imageId: 'prop-1-img',
    createdAt: '2022-08-15T10:00:00Z',
    isDeleted: false,
    members: {},
    totalInvestment: 250000,
    status: 'Occupied',
    monthlyRent: 2200,
    paymentDueDay: 1,
    tenantName: 'John Doe',
    tenantContact: 'john.doe@email.com',
    constructionStage: 'Completed',
    units: 1,
    unitsList: [
      {
        id: 'unit-1-mock',
        unitName: 'Main Villa',
        status: 'Occupied',
        tenantName: 'John Doe',
        tenantContact: 'john.doe@email.com',
        monthlyRent: 2200,
        paymentDueDay: 1,
      }
    ],
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
    categoryId: 'apartment',
    location: 'Downtown, Metro City',
    size: '12-unit building',
    description: 'Modern apartment building in the heart of the city.',
    type: 'Under Construction',
    imageId: 'prop-2-img',
    createdAt: '2023-05-20T14:30:00Z',
    isDeleted: false,
    members: {},
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
    categoryId: 'commercial',
    location: 'Business District, Metro City',
    size: '5000 sqft Office Space',
    description: 'Prime commercial property with high foot traffic.',
    type: 'Finished',
    imageId: 'prop-3-img',
    createdAt: '2021-11-01T09:00:00Z',
    isDeleted: false,
    members: {},
    totalInvestment: 750000,
    status: 'Occupied',
    monthlyRent: 8000,
    paymentDueDay: 5,
    tenantName: 'Innovate Corp',
    tenantContact: 'contact@innovatecorp.com',
    constructionStage: 'Completed',
    units: 1,
    unitsList: [
      {
        id: 'unit-3-mock',
        unitName: 'Suite 101',
        status: 'Occupied',
        tenantName: 'Innovate Corp',
        tenantContact: 'contact@innovatecorp.com',
        monthlyRent: 8000,
        paymentDueDay: 5,
      }
    ],
    totalConstructionCost: 0,
    totalRentReceived: 0,
    totalMaintenanceCost: 0,
    remainingInvestment: 0,
    totalProfit: 0,
    netProfit: 0,
    costOverrunAlert:
      'Overrun detected due to "unexpected repair" on the HVAC system, increasing maintenance costs.',
  },
];

let constructionExpenses: ConstructionExpense[] = [];
let rentalIncomes: RentalIncome[] = [];
let maintenanceExpenses: MaintenanceExpense[] = [];
let constructionBudgetItems: ConstructionBudgetItem[] = [];
let maintenanceBudgetItems: MaintenanceBudgetItem[] = [];

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

export const getConstructionBudgetItems = async (propertyId: string) =>
  constructionBudgetItems.filter((b) => b.propertyId === propertyId);

export const getMaintenanceBudgetItems = async (propertyId: string) =>
  maintenanceBudgetItems.filter((b) => b.propertyId === propertyId);


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

export const addConstructionBudgetItem = async (
  item: Omit<ConstructionBudgetItem, 'id'>
) => {
  const newItem: ConstructionBudgetItem = {
    ...item,
    id: `cb-${Date.now()}`,
    actualCost: item.actualCost ?? 0,
  };
  constructionBudgetItems.push(newItem);
  return newItem;
};

export const addMaintenanceBudgetItem = async (
  item: Omit<MaintenanceBudgetItem, 'id'>
) => {
  const newItem: MaintenanceBudgetItem = {
    ...item,
    id: `mb-${Date.now()}`,
    actualCost: item.actualCost ?? 0,
  };
  maintenanceBudgetItems.push(newItem);
  return newItem;
};

export const updateConstructionBudgetItem = async (
  id: string,
  updates: Partial<ConstructionBudgetItem>
) => {
  constructionBudgetItems = constructionBudgetItems.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  return constructionBudgetItems.find((item) => item.id === id);
};

export const updateMaintenanceBudgetItem = async (
  id: string,
  updates: Partial<MaintenanceBudgetItem>
) => {
  maintenanceBudgetItems = maintenanceBudgetItems.map((item) =>
    item.id === id ? { ...item, ...updates } : item
  );
  return maintenanceBudgetItems.find((item) => item.id === id);
};

export const deleteConstructionExpense = async (id: string) => {
  constructionExpenses = constructionExpenses.filter((e) => e.id !== id);
  return true;
};

export const deleteMaintenanceExpense = async (id: string) => {
  maintenanceExpenses = maintenanceExpenses.filter((e) => e.id !== id);
  return true;
};

export const deleteConstructionBudgetItem = async (id: string) => {
  constructionBudgetItems = constructionBudgetItems.filter((b) => b.id !== id);
  return true;
};

export const deleteMaintenanceBudgetItem = async (id: string) => {
  maintenanceBudgetItems = maintenanceBudgetItems.filter((b) => b.id !== id);
  return true;
};
