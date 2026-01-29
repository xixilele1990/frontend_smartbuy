// Buyer Profile API Service
import type { UserProfile } from '../types';
import { apiFetch, getSessionId } from './api';

/**
 * DTO for sending profile data to the backend
 * Matches the backend BuyerProfileDTO structure
 */
interface BuyerProfileDTO {
  sessionId: string;
  maxPrice: number;
  minBedrooms: number;
  minBathrooms: number;
  priorityMode: string;
}

/**
 * Backend response structure
 */
interface BuyerProfileResponse {
  profileId: number;
  sessionId: string;
  maxPrice: number;
  minBedrooms: number;
  minBathrooms: number;
  priorityMode: string;
  updatedAt: string;
}

/**
 * Map frontend PriorityMode to backend format
 */
const mapPriorityModeToBackend = (mode: string): string => {
  const mapping: Record<string, string> = {
    'Balanced': 'BALANCED',
    'Budget Driven': 'BUDGET_DRIVEN',
    'Safety First': 'SAFETY_FIRST',
    'Education First': 'EDUCATION_FIRST'
  };
  return mapping[mode] || 'BALANCED';
};

/**
 * Map backend format to frontend PriorityMode
 */
const mapPriorityModeFromBackend = (mode: string): string => {
  const mapping: Record<string, string> = {
    'BALANCED': 'Balanced',
    'BUDGET_DRIVEN': 'Budget Driven',
    'SAFETY_FIRST': 'Safety First',
    'EDUCATION_FIRST': 'Education First'
  };
  return mapping[mode] || 'Balanced';
};

/**
 * Convert frontend UserProfile to backend DTO
 */
const toDTO = (profile: UserProfile): BuyerProfileDTO => ({
  sessionId: getSessionId(),
  maxPrice: profile.budget,
  minBedrooms: profile.targetBedrooms,
  minBathrooms: profile.targetBathrooms,
  priorityMode: mapPriorityModeToBackend(profile.priorityMode)
});

/**
 * Convert backend response to frontend UserProfile
 */
const fromResponse = (response: BuyerProfileResponse): UserProfile => ({
  budget: response.maxPrice,
  targetBedrooms: response.minBedrooms,
  targetBathrooms: response.minBathrooms,
  hasSchoolNeed: response.priorityMode === 'EDUCATION_FIRST',
  priorityMode: mapPriorityModeFromBackend(response.priorityMode) as any
});

export async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  const dto = toDTO(profile);
  const response = await apiFetch<BuyerProfileResponse>(
    '/buyerProfile',
    {
      method: 'POST',
      body: JSON.stringify(dto),
    }
  );
  return fromResponse(response);
}

export async function getProfile(): Promise<UserProfile | null> {
  try {
    const sessionId = getSessionId();
    const response = await apiFetch<BuyerProfileResponse>(
      `/buyerProfile/${sessionId}`,
      { method: 'GET' }
    );
    return fromResponse(response);
  } catch (error: any) {
    // Return null if profile not found (404)
    if (error.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function deleteProfile(): Promise<void> {
  const sessionId = getSessionId();
  await apiFetch<void>(
    `/buyerProfile/${sessionId}`,
    { method: 'DELETE' }
  );
}
