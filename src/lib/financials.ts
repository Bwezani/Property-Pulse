import type {
  Property,
  ConstructionExpense,
  RentalIncome,
  MaintenanceExpense,
} from './types';

/**
 * Calculates and returns the full financial status of a property.
 * @param property The base property object.
 * @param allConstructionExpenses All construction expenses from the database.
 * @param allRentalIncomes All rental incomes from the database.
 * @param allMaintenanceExpenses All maintenance expenses from the database.
 * @returns An updated Property object with all financial fields calculated.
 */
export function calculatePropertyFinancials(
  property: Property,
  allConstructionExpenses: ConstructionExpense[],
  allRentalIncomes: RentalIncome[],
  allMaintenanceExpenses: MaintenanceExpense[]
): Property {
  // Filter expenses and incomes for the current property
  const propertyConstructionExpenses = allConstructionExpenses.filter(e => e.propertyId === property.id);
  const propertyRentalIncomes = allRentalIncomes.filter(i => i.propertyId === property.id && i.status === 'Paid');
  const propertyMaintenanceExpenses = allMaintenanceExpenses.filter(e => e.propertyId === property.id);

  // Calculate total costs and incomes
  const totalConstructionCost = propertyConstructionExpenses.reduce((sum, expense) => sum + expense.totalPrice, 0);
  const totalRentReceived = propertyRentalIncomes.reduce((sum, income) => sum + income.amount, 0);
  const totalMaintenanceCost = propertyMaintenanceExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  // Determine total investment based on property type
  const totalInvestment = property.type === 'Finished' 
    ? property.totalInvestment 
    : totalConstructionCost;

  // Calculate recovery and profit
  let remainingInvestment = 0;
  let totalProfit = 0;

  if (totalRentReceived < totalInvestment) {
    remainingInvestment = totalInvestment - totalRentReceived;
    totalProfit = 0;
  } else {
    remainingInvestment = 0;
    totalProfit = totalRentReceived - totalInvestment;
  }

  const netProfit = totalProfit - totalMaintenanceCost;
  
  // Create a fully calculated financial object for the property
  const calculatedProperty: Property = {
    ...property,
    totalConstructionCost: property.type === 'Under Construction' ? totalConstructionCost : property.totalInvestment,
    totalInvestment,
    totalRentReceived,
    totalMaintenanceCost,
    remainingInvestment,
    totalProfit,
    netProfit,
  };

  return calculatedProperty;
}
