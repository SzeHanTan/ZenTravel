/**
 * Mock Insurance API
 * * Provides mock data for travel insurance plans based on user-provided visuals.
 */

// Interface for an insurance plan
export interface InsurancePlan {
  id: string;
  type: 'overseas' | 'domestic';
  category: string;
  title: string;
  coverages: string[];
  priceDisplay: string;
  currency: string;
  priceBase: number;
}

// Mock data strictly based on the provided image
const INSURANCE_PLANS: InsurancePlan[] = [
  {
    id: 'tp_overseas',
    type: 'overseas',
    category: 'Travel PA',
    title: 'Travel PA - Overseas',
    coverages: [
      'Overseas medical expenses up to RM 300,000',
      'Cancellation or postponement RM 20,000',
      'Baggage and personal effects RM 5,000',
    ],
    priceDisplay: 'From RM 55.00',
    currency: 'MYR',
    priceBase: 55.00,
  },
  {
    id: 'tp_domestic',
    type: 'domestic',
    category: 'Travel PA',
    title: 'Travel PA - Domestic',
    coverages: [
      'Medical expenses RM 50,000',
      'Travel delay RM 1,000',
      'Baggage and personal effects RM 2,000',
    ],
    priceDisplay: 'From RM 15.00',
    currency: 'MYR',
    priceBase: 15.00,
  },
];

/**
 * Mock function to retrieve available insurance plans.
 * * @returns A promise that resolves to an array of InsurancePlan objects.
 */
export async function getInsurancePlans(): Promise<InsurancePlan[]> {
  // Simulate API latency (500ms)
  await new Promise((resolve) => setTimeout(resolve, 500));
  return INSURANCE_PLANS;
}

/**
 * Mock function to retrieve a specific insurance plan by its type.
 * * @param type The type of plan to retrieve ('overseas' or 'domestic').
 * @returns A promise that resolves to the matching InsurancePlan or null if not found.
 */
export async function getInsurancePlanByType(type: 'overseas' | 'domestic'): Promise<InsurancePlan | null> {
  // Simulate API latency (300ms)
  await new Promise((resolve) => setTimeout(resolve, 300));
  return INSURANCE_PLANS.find(plan => plan.type === type) || null;
}