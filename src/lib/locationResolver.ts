import { IndianState } from "@/types/location";
import { getStateFromPincode } from "@/data/departments";

type CityPoint = {
  city: string;
  state: IndianState;
  district: string;
  lat: number;
  lng: number;
  keywords: string[];
  pincodePrefixes: string[];
};

const CITY_POINTS: CityPoint[] = [
  { city: "Pune", state: "Maharashtra", district: "Pune", lat: 18.5204, lng: 73.8567, keywords: ["pune", "kothrud", "viman nagar", "fc road"], pincodePrefixes: ["411"] },
  { city: "Mumbai", state: "Maharashtra", district: "Mumbai", lat: 19.076, lng: 72.8777, keywords: ["mumbai", "bandra", "borivali", "andheri", "cst", "churchgate"], pincodePrefixes: ["400"] },
  { city: "Delhi", state: "Delhi", district: "New Delhi", lat: 28.6139, lng: 77.209, keywords: ["delhi", "connaught", "india gate", "cp"], pincodePrefixes: ["110"] },
  { city: "Bengaluru", state: "Karnataka", district: "Bengaluru Urban", lat: 12.9716, lng: 77.5946, keywords: ["bengaluru", "bangalore", "indiranagar", "whitefield", "cubbon"], pincodePrefixes: ["560"] },
  { city: "Chennai", state: "Tamil Nadu", district: "Chennai", lat: 13.0827, lng: 80.2707, keywords: ["chennai", "anna salai", "tnagar", "adyar"], pincodePrefixes: ["600"] },
  { city: "Hyderabad", state: "Telangana", district: "Hyderabad", lat: 17.385, lng: 78.4867, keywords: ["hyderabad", "jubilee hills", "secunderabad", "hitech"], pincodePrefixes: ["500"] },
  { city: "Lucknow", state: "Uttar Pradesh", district: "Lucknow", lat: 26.8467, lng: 80.9462, keywords: ["lucknow", "gomti nagar", "hazratganj"], pincodePrefixes: ["226"] },
  { city: "Kolkata", state: "West Bengal", district: "Kolkata", lat: 22.5726, lng: 88.3639, keywords: ["kolkata", "salt lake", "howrah"], pincodePrefixes: ["700"] },
  { city: "Jaipur", state: "Rajasthan", district: "Jaipur", lat: 26.9124, lng: 75.7873, keywords: ["jaipur", "mi road", "malviya nagar"], pincodePrefixes: ["302"] },
  { city: "Ahmedabad", state: "Gujarat", district: "Ahmedabad", lat: 23.0225, lng: 72.5714, keywords: ["ahmedabad", "cg road", "satellite"], pincodePrefixes: ["380"] },
  { city: "Chandigarh", state: "Chandigarh", district: "Chandigarh", lat: 30.7333, lng: 76.7794, keywords: ["chandigarh", "sector 17"], pincodePrefixes: ["160"] },
];

const STATE_FALLBACKS: Partial<Record<IndianState, { lat: number; lng: number; city: string; district: string }>> = {
  Maharashtra: { lat: 19.7515, lng: 75.7139, city: "Maharashtra", district: "Maharashtra" },
  Delhi: { lat: 28.6139, lng: 77.209, city: "Delhi", district: "New Delhi" },
  Karnataka: { lat: 12.9716, lng: 77.5946, city: "Bengaluru", district: "Bengaluru Urban" },
  "Tamil Nadu": { lat: 13.0827, lng: 80.2707, city: "Chennai", district: "Chennai" },
  Telangana: { lat: 17.385, lng: 78.4867, city: "Hyderabad", district: "Hyderabad" },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462, city: "Lucknow", district: "Lucknow" },
  "West Bengal": { lat: 22.5726, lng: 88.3639, city: "Kolkata", district: "Kolkata" },
  Rajasthan: { lat: 26.9124, lng: 75.7873, city: "Jaipur", district: "Jaipur" },
  Gujarat: { lat: 23.0225, lng: 72.5714, city: "Ahmedabad", district: "Ahmedabad" },
  Chandigarh: { lat: 30.7333, lng: 76.7794, city: "Chandigarh", district: "Chandigarh" },
};

type ResolveInput = {
  location: string;
  pincode?: string;
  gps?: { lat: number; lng: number } | null;
  stateHint?: IndianState | null;
};

export function resolveIssueLocation(input: ResolveInput) {
  const rawLocation = (input.location || "").trim();

  if (input.gps?.lat && input.gps?.lng) {
    const state = input.stateHint || (input.pincode ? getStateFromPincode(input.pincode) : null) || "Unknown";
    return {
      normalizedAddress: rawLocation,
      locationData: {
        lat: input.gps.lat,
        lng: input.gps.lng,
        address: rawLocation,
        city: "",
        district: "",
        state,
      },
    };
  }

  const lower = rawLocation.toLowerCase();
  const fromName = CITY_POINTS.find((point) => point.keywords.some((keyword) => lower.includes(keyword)));
  const fromPincode = input.pincode && input.pincode.length >= 3
    ? CITY_POINTS.find((point) => point.pincodePrefixes.some((prefix) => input.pincode!.startsWith(prefix)))
    : undefined;
  const matched = fromName || fromPincode;

  if (matched) {
    const normalizedAddress = rawLocation || `${matched.city}, ${matched.state}`;
    return {
      normalizedAddress,
      locationData: {
        lat: matched.lat,
        lng: matched.lng,
        address: normalizedAddress,
        city: matched.city,
        district: matched.district,
        state: matched.state,
      },
    };
  }

  const inferredState = input.stateHint || (input.pincode ? getStateFromPincode(input.pincode) : null) || "Unknown";
  const fallback = inferredState !== "Unknown" ? STATE_FALLBACKS[inferredState] : undefined;
  const normalizedAddress = rawLocation || (fallback ? `${fallback.city}, ${inferredState}` : "Unknown location");

  return {
    normalizedAddress,
    locationData: {
      lat: fallback?.lat || 0,
      lng: fallback?.lng || 0,
      address: normalizedAddress,
      city: fallback?.city || "",
      district: fallback?.district || "",
      state: inferredState,
    },
  };
}
