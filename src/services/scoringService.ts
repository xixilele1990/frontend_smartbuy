// Scoring/SmartScore API Service
import type { UserProfile, House } from '../types';
import { apiFetch } from './api';

/**
 * Response from backend score API
 */
export interface ScoreResponse {
  house: House;
  totalScore: number;
  warnings?: string[];
}

/**
 * Backend response for batch scoring
 */
interface BatchScoreResponse {
  results: ScoreResponse[];
}

/**
 * Score a single house with buyer profile
 */
export async function scoreHouse(profile: UserProfile, house: House): Promise<ScoreResponse> {
  const requestBody = {
    buyerProfile: {
      priorityMode: mapPriorityModeToBackend(profile.priorityMode),
      maxPrice: profile.budget,
      minBedrooms: profile.targetBedrooms,
      minBathrooms: profile.targetBathrooms,
    },
    house,
  };
  
  console.log('[scoreHouse] Sending request to /api/score/house:', requestBody);
  
  try {
    const response = await apiFetch<ScoreResponse>(
      `/api/score/house`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );
    console.log('[scoreHouse] Response:', response);
    return response;
  } catch (error) {
    console.error('[scoreHouse] Error:', error);
    throw error;
  }
}

/**
 * Score multiple addresses using ATTOM data and return sorted by score
 */
export async function batchScoreFromAddresses(
  profile: UserProfile,
  addresses: Array<{ address1: string; address2: string }>
): Promise<ScoreResponse[]> {
  const requestBody = {
    buyerProfile: {
      priorityMode: mapPriorityModeToBackend(profile.priorityMode),
      maxPrice: profile.budget,
      minBedrooms: profile.targetBedrooms,
      minBathrooms: profile.targetBathrooms,
    },
    addresses,
  };
  
  console.log('[batchScoreFromAddresses] Sending request to /api/score/batch-from-attom:', requestBody);
  
  try {
    const response = await apiFetch<BatchScoreResponse>(
      `/api/score/batch-from-attom`,
      {
        method: 'POST',
        body: JSON.stringify(requestBody),
      }
    );
    console.log('[batchScoreFromAddresses] Response:', response);
    return response.results;
  } catch (error) {
    console.error('[batchScoreFromAddresses] Error:', error);
    throw error;
  }
}

const mapPriorityModeToBackend = (mode: string): string => {
  const mapping: Record<string, string> = {
    'Balanced': 'BALANCED',
    'Budget Driven': 'BUDGET_DRIVEN',
    'Safety First': 'SAFETY_FIRST',
    'Education First': 'EDUCATION_FIRST'
  };
  return mapping[mode] || 'BALANCED';
};
