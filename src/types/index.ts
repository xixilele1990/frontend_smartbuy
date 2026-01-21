// SmartBuy Type Definitions
// Define all TypeScript interfaces and types for the application

/**
 * Priority modes for scoring calculation
 * These determine the weight distribution in the SmartScore algorithm
 */
export type PriorityMode = 'Balanced' | 'Budget Driven' | 'Safety First' | 'Education First';

/**
 * User profile with buyer preferences
 */
export interface UserProfile {
  id?: number;
  zipCode?: string;
  commuteAddress?: string;
  budget: number;
  maxMonthlyPayment?: number;
  targetBedrooms: number;
  targetBathrooms: number;
  hasSchoolNeed: boolean;
  priorityMode: PriorityMode;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * House/Property information
 */
export interface House {
  id?: number;
  userId?: number;
  address: string;
  attomId?: string;
  geoIdV4?: string;
  propertyType?: string;
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  crimeIndex?: number;
  schoolScore?: number;
  avm?: number; // Automated Valuation Model (property value)
  createdAt?: string;
}

/**
 * Scoring result for a property
 */
export interface ScoringResult {
  id?: number;
  houseId: number;
  affordabilityScore: number;
  safetyScore: number;
  educationScore: number;
  spaceScore: number;
  smartScore: number;
  smartScoreExplanation?: string;
  createdAt?: string;
}

/**
 * House with its scoring result
 */
export interface HouseWithScore extends House {
  scoringResult?: ScoringResult;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
