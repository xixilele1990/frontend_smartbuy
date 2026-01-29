// House/Property API Service
import type { House } from '../types';
import { apiFetch } from './api';

/**
 * Backend House response from ATTOM API
 */
interface HouseFromAttom {
  attomId: number;
  address1: string;
  address2: string;
  beds?: number;
  bathsTotal?: number;
  roomsTotal?: number;
  avmValue?: number;
  geoIdV4?: string;
  crimeId?: string;
  schoolsJson?: string;
  crimeIndex?: number;
}

/**
 * Address input format for backend
 */
interface AddressInput {
  address1: string;
  address2: string;
}

/**
 * Convert frontend House to backend format (address1, address2)
 */
const addressToBackend = (address: string): AddressInput => {
  // Split address into address1 (street) and address2 (city, state, zip)
  const parts = address.split(',').map(p => p.trim());
  return {
    address1: parts[0] || address,
    address2: parts.slice(1).join(', ') || 'Unknown',
  };
};

/**
 * Convert backend House response to frontend House
 */
const fromResponse = (response: HouseFromAttom, address: string): House => ({
  id: response.attomId || 0,
  address: address,
  bedrooms: response.beds,
  bathrooms: response.bathsTotal ? Math.round(response.bathsTotal.valueOf() as number) : undefined,
  squareFeet: response.roomsTotal,
  createdAt: new Date().toISOString(),
});

/**
 * Add a house by fetching data from ATTOM API
 */
export async function addHouse(house: House): Promise<House> {
  const addr = addressToBackend(house.address);
  
  console.log('Adding house with address:', house.address);
  console.log('Parsed address1:', addr.address1);
  console.log('Parsed address2:', addr.address2);
  
  // Use URL query parameters since backend endpoint expects them
  const queryParams = new URLSearchParams({
    address1: addr.address1,
    address2: addr.address2,
  }).toString();
  const queryUrl = `/api/houses/from-attom-hardcoded?${queryParams}`;
  
  console.log('API URL:', queryUrl);
  
  try {
    const response = await apiFetch<{ house: HouseFromAttom; warnings: string[] }>(
      queryUrl,
      {
        method: 'POST',
      }
    );

    if (!response.house) {
      throw new Error('Failed to import house from ATTOM: No house data returned');
    }

    console.log('House import successful:', response.house);
    console.log('House import warnings:', response.warnings);
    return fromResponse(response.house, house.address);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('House import error:', errorMsg);
    throw new Error(`Failed to find house at "${house.address}": ${errorMsg}`);
  }
}
