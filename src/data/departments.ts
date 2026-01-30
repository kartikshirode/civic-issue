/**
 * Department Routing Data
 * Maps categories to state-wise government departments
 * Each state has specific departments handling civic issues
 */

import { IssueCategory } from "@/types";
import { IndianState } from "@/types/location";

// =============================================================================
// Types
// =============================================================================

export interface Department {
  name: string;
  shortName: string;
  email?: string;
  phone?: string;
  website?: string;
}

export interface StateDepartments {
  roads: Department;
  water: Department;
  electricity: Department;
  sanitation: Department;
  'public-spaces': Department;
  transportation: Department;
  other: Department;
}

// =============================================================================
// Pincode to State Mapping (Major Pincodes)
// =============================================================================

export const pincodeRanges: { start: number; end: number; state: IndianState }[] = [
  // Delhi
  { start: 110001, end: 110099, state: "Delhi" },
  
  // Maharashtra
  { start: 400001, end: 400099, state: "Maharashtra" }, // Mumbai
  { start: 411001, end: 411099, state: "Maharashtra" }, // Pune
  { start: 413001, end: 413199, state: "Maharashtra" }, // Baramati area
  { start: 440001, end: 440099, state: "Maharashtra" }, // Nagpur
  
  // Karnataka
  { start: 560001, end: 560099, state: "Karnataka" }, // Bangalore
  { start: 580001, end: 580099, state: "Karnataka" }, // Hubli
  
  // Tamil Nadu
  { start: 600001, end: 600099, state: "Tamil Nadu" }, // Chennai
  { start: 641001, end: 641099, state: "Tamil Nadu" }, // Coimbatore
  
  // Kerala
  { start: 682001, end: 682099, state: "Kerala" }, // Kochi
  { start: 695001, end: 695099, state: "Kerala" }, // Trivandrum
  
  // West Bengal
  { start: 700001, end: 700099, state: "West Bengal" }, // Kolkata
  
  // Uttar Pradesh
  { start: 201001, end: 201099, state: "Uttar Pradesh" }, // Ghaziabad
  { start: 226001, end: 226099, state: "Uttar Pradesh" }, // Lucknow
  { start: 211001, end: 211099, state: "Uttar Pradesh" }, // Prayagraj
  
  // Rajasthan
  { start: 302001, end: 302099, state: "Rajasthan" }, // Jaipur
  { start: 313001, end: 313099, state: "Rajasthan" }, // Udaipur
  
  // Gujarat
  { start: 380001, end: 380099, state: "Gujarat" }, // Ahmedabad
  { start: 395001, end: 395099, state: "Gujarat" }, // Surat
  
  // Madhya Pradesh
  { start: 462001, end: 462099, state: "Madhya Pradesh" }, // Bhopal
  { start: 452001, end: 452099, state: "Madhya Pradesh" }, // Indore
  
  // Bihar
  { start: 800001, end: 800099, state: "Bihar" }, // Patna
  
  // Telangana
  { start: 500001, end: 500099, state: "Telangana" }, // Hyderabad
  
  // Andhra Pradesh
  { start: 520001, end: 520099, state: "Andhra Pradesh" }, // Vijayawada
  { start: 530001, end: 530099, state: "Andhra Pradesh" }, // Visakhapatnam
  
  // Punjab
  { start: 160001, end: 160099, state: "Punjab" }, // Chandigarh/Mohali
  { start: 141001, end: 141099, state: "Punjab" }, // Ludhiana
  
  // Haryana
  { start: 122001, end: 122099, state: "Haryana" }, // Gurgaon
  { start: 121001, end: 121099, state: "Haryana" }, // Faridabad
  
  // Odisha
  { start: 751001, end: 751099, state: "Odisha" }, // Bhubaneswar
  
  // Assam
  { start: 781001, end: 781099, state: "Assam" }, // Guwahati
  
  // Jharkhand
  { start: 834001, end: 834099, state: "Jharkhand" }, // Ranchi
  
  // Chhattisgarh
  { start: 492001, end: 492099, state: "Chhattisgarh" }, // Raipur
  
  // Uttarakhand
  { start: 248001, end: 248099, state: "Uttarakhand" }, // Dehradun
  
  // Himachal Pradesh
  { start: 171001, end: 171099, state: "Himachal Pradesh" }, // Shimla
  
  // Goa
  { start: 403001, end: 403099, state: "Goa" }, // Panaji
  
  // Jammu and Kashmir
  { start: 180001, end: 180099, state: "Jammu and Kashmir" }, // Jammu
  { start: 190001, end: 190099, state: "Jammu and Kashmir" }, // Srinagar
];

/**
 * Get state from pincode
 */
export function getStateFromPincode(pincode: string): IndianState | null {
  const pin = parseInt(pincode, 10);
  if (isNaN(pin) || pincode.length !== 6) return null;
  
  for (const range of pincodeRanges) {
    if (pin >= range.start && pin <= range.end) {
      return range.state;
    }
  }
  
  // Fallback based on first digit
  const firstDigit = pincode[0];
  const stateByFirstDigit: Record<string, IndianState> = {
    '1': 'Delhi',
    '2': 'Uttar Pradesh',
    '3': 'Rajasthan',
    '4': 'Maharashtra',
    '5': 'Telangana',
    '6': 'Tamil Nadu',
    '7': 'West Bengal',
    '8': 'Bihar',
    '9': 'Assam',
  };
  
  return stateByFirstDigit[firstDigit] || null;
}

// =============================================================================
// State-wise Department Mappings
// =============================================================================

const defaultDepartment: Department = {
  name: "Municipal Corporation",
  shortName: "MC",
  email: "grievance@municipal.gov.in",
  phone: "1800-XXX-XXXX"
};

export const stateDepartments: Record<IndianState, StateDepartments> = {
  "Maharashtra": {
    roads: {
      name: "Public Works Department, Maharashtra",
      shortName: "PWD Maharashtra",
      email: "pwd.maharashtra@gov.in",
      phone: "022-22027837",
      website: "https://pwd.maharashtra.gov.in"
    },
    water: {
      name: "Maharashtra Jeevan Pradhikaran",
      shortName: "MJP",
      email: "mjp.maharashtra@gov.in",
      phone: "020-25501255",
      website: "https://mjp.gov.in"
    },
    electricity: {
      name: "Maharashtra State Electricity Distribution Co. Ltd",
      shortName: "MSEDCL",
      email: "msedcl@mahadiscom.in",
      phone: "1800-102-3435",
      website: "https://www.mahadiscom.in"
    },
    sanitation: {
      name: "Maharashtra Pollution Control Board",
      shortName: "MPCB",
      email: "mpcb@maharashtra.gov.in",
      phone: "022-24027421"
    },
    "public-spaces": {
      name: "Urban Development Department, Maharashtra",
      shortName: "UDD Maharashtra",
      email: "udd.maharashtra@gov.in"
    },
    transportation: {
      name: "Maharashtra State Road Transport Corporation",
      shortName: "MSRTC",
      email: "msrtc@maharashtra.gov.in",
      phone: "022-23024000"
    },
    other: {
      name: "District Collector Office",
      shortName: "DC Office",
      email: "collector@maharashtra.gov.in"
    }
  },
  
  "Delhi": {
    roads: {
      name: "Public Works Department, Delhi",
      shortName: "PWD Delhi",
      email: "pwd.delhi@gov.in",
      phone: "011-23392019",
      website: "https://pwd.delhi.gov.in"
    },
    water: {
      name: "Delhi Jal Board",
      shortName: "DJB",
      email: "ceo@djb.nic.in",
      phone: "1916",
      website: "https://delhijalboard.delhi.gov.in"
    },
    electricity: {
      name: "BSES / Tata Power Delhi",
      shortName: "DISCOM Delhi",
      email: "customercare@bsesdelhi.com",
      phone: "1800-103-2837"
    },
    sanitation: {
      name: "Municipal Corporation of Delhi",
      shortName: "MCD",
      email: "mcd@nic.in",
      phone: "011-23225453"
    },
    "public-spaces": {
      name: "Delhi Development Authority",
      shortName: "DDA",
      email: "vc@dda.gov.in",
      website: "https://dda.gov.in"
    },
    transportation: {
      name: "Delhi Transport Corporation",
      shortName: "DTC",
      email: "dtc@nic.in",
      phone: "011-23378143"
    },
    other: {
      name: "Delhi Government Grievance Cell",
      shortName: "Grievance Cell",
      email: "cmdelhi@nic.in",
      phone: "1031"
    }
  },
  
  "Karnataka": {
    roads: {
      name: "Karnataka Public Works Department",
      shortName: "PWD Karnataka",
      email: "pwd.karnataka@gov.in",
      website: "https://kpwd.karnataka.gov.in"
    },
    water: {
      name: "Karnataka Urban Water Supply & Drainage Board",
      shortName: "KUWSDB",
      email: "kuwsdb@kar.nic.in"
    },
    electricity: {
      name: "Bangalore Electricity Supply Company",
      shortName: "BESCOM",
      email: "md@bescom.co.in",
      phone: "1912"
    },
    sanitation: {
      name: "Bruhat Bengaluru Mahanagara Palike",
      shortName: "BBMP",
      email: "commissioner@bbmp.gov.in"
    },
    "public-spaces": {
      name: "BBMP Parks Department",
      shortName: "BBMP Parks",
      email: "parks@bbmp.gov.in"
    },
    transportation: {
      name: "Bangalore Metropolitan Transport Corporation",
      shortName: "BMTC",
      email: "bmtc@kar.nic.in"
    },
    other: {
      name: "Karnataka Government Portal",
      shortName: "Janaspandana",
      website: "https://janaspandana.karnataka.gov.in"
    }
  },
  
  "Tamil Nadu": {
    roads: {
      name: "Highways Department, Tamil Nadu",
      shortName: "TN Highways",
      email: "highways.tn@gov.in"
    },
    water: {
      name: "Tamil Nadu Water Supply and Drainage Board",
      shortName: "TWAD",
      email: "twad@tn.gov.in"
    },
    electricity: {
      name: "Tamil Nadu Generation and Distribution Corporation",
      shortName: "TANGEDCO",
      email: "tangedco@tn.gov.in",
      phone: "1912"
    },
    sanitation: {
      name: "Greater Chennai Corporation",
      shortName: "GCC",
      email: "gcc@tn.gov.in"
    },
    "public-spaces": {
      name: "Chennai Metropolitan Development Authority",
      shortName: "CMDA",
      email: "cmda@tn.gov.in"
    },
    transportation: {
      name: "Metropolitan Transport Corporation Chennai",
      shortName: "MTC",
      email: "mtc@tn.gov.in"
    },
    other: {
      name: "Tamil Nadu Grievance Cell",
      shortName: "TN CM Cell",
      email: "cmcell@tn.gov.in"
    }
  },
  
  "Uttar Pradesh": {
    roads: {
      name: "Public Works Department, Uttar Pradesh",
      shortName: "PWD UP",
      email: "pwd.up@gov.in"
    },
    water: {
      name: "UP Jal Nigam",
      shortName: "UPJN",
      email: "upjn@up.gov.in"
    },
    electricity: {
      name: "Uttar Pradesh Power Corporation Ltd",
      shortName: "UPPCL",
      email: "uppcl@up.gov.in",
      phone: "1912"
    },
    sanitation: {
      name: "Nagar Nigam / Municipal Corporation",
      shortName: "Nagar Nigam",
      email: "nagarnigam@up.gov.in"
    },
    "public-spaces": {
      name: "UP Housing and Urban Planning",
      shortName: "UP Housing",
      email: "housing.up@gov.in"
    },
    transportation: {
      name: "UP State Road Transport Corporation",
      shortName: "UPSRTC",
      email: "upsrtc@up.gov.in"
    },
    other: {
      name: "Integrated Grievance Redressal System UP",
      shortName: "IGRS UP",
      website: "https://igrsup.gov.in"
    }
  },
  
  // Default for states not explicitly defined
  "Andhra Pradesh": {
    roads: { name: "Roads & Buildings Department, AP", shortName: "R&B AP", email: "rnb.ap@gov.in" },
    water: { name: "AP Water Resources Department", shortName: "APWRD", email: "apwrd@ap.gov.in" },
    electricity: { name: "AP Southern Power Distribution", shortName: "APSPDCL", email: "apspdcl@ap.gov.in" },
    sanitation: { name: "Municipal Administration AP", shortName: "MA AP", email: "ma.ap@gov.in" },
    "public-spaces": { name: "AP Urban Development", shortName: "APUD", email: "apud@gov.in" },
    transportation: { name: "APSRTC", shortName: "APSRTC", email: "apsrtc@ap.gov.in" },
    other: { name: "AP Grievance Cell", shortName: "Spandana", email: "spandana@ap.gov.in" }
  },
  
  "Telangana": {
    roads: { name: "Roads & Buildings Department, Telangana", shortName: "R&B Telangana", email: "rnb.ts@gov.in" },
    water: { name: "Hyderabad Metropolitan Water Supply", shortName: "HMWSSB", email: "hmwssb@ts.gov.in" },
    electricity: { name: "Telangana State Southern Power Distribution", shortName: "TSSPDCL", email: "tsspdcl@ts.gov.in" },
    sanitation: { name: "GHMC Hyderabad", shortName: "GHMC", email: "ghmc@ts.gov.in" },
    "public-spaces": { name: "GHMC Parks", shortName: "GHMC Parks", email: "parks.ghmc@ts.gov.in" },
    transportation: { name: "TSRTC", shortName: "TSRTC", email: "tsrtc@ts.gov.in" },
    other: { name: "Telangana Grievance Cell", shortName: "Prajavani", email: "prajavani@ts.gov.in" }
  },
  
  "Gujarat": {
    roads: { name: "Roads & Buildings Department, Gujarat", shortName: "R&B Gujarat", email: "rnb.guj@gov.in" },
    water: { name: "Gujarat Water Supply & Sewerage Board", shortName: "GWSSB", email: "gwssb@gujarat.gov.in" },
    electricity: { name: "Gujarat Urja Vikas Nigam", shortName: "GUVNL", email: "guvnl@gujarat.gov.in" },
    sanitation: { name: "Ahmedabad Municipal Corporation", shortName: "AMC", email: "amc@ahmedabadcity.gov.in" },
    "public-spaces": { name: "Gujarat Urban Development", shortName: "GUDC", email: "gudc@gujarat.gov.in" },
    transportation: { name: "Gujarat State Road Transport Corporation", shortName: "GSRTC", email: "gsrtc@gujarat.gov.in" },
    other: { name: "Gujarat Grievance Portal", shortName: "iGram", email: "igram@gujarat.gov.in" }
  },
  
  "West Bengal": {
    roads: { name: "Public Works Department, West Bengal", shortName: "PWD WB", email: "pwd.wb@gov.in" },
    water: { name: "Kolkata Municipal Corporation Water", shortName: "KMC Water", email: "kmc.water@wb.gov.in" },
    electricity: { name: "West Bengal State Electricity Distribution", shortName: "WBSEDCL", email: "wbsedcl@wb.gov.in" },
    sanitation: { name: "Kolkata Municipal Corporation", shortName: "KMC", email: "kmc@wb.gov.in" },
    "public-spaces": { name: "KMC Parks & Squares", shortName: "KMC Parks", email: "kmc.parks@wb.gov.in" },
    transportation: { name: "West Bengal Transport Corporation", shortName: "WBTC", email: "wbtc@wb.gov.in" },
    other: { name: "WB CM Grievance Cell", shortName: "Duare Sarkar", email: "cm.wb@gov.in" }
  },
  
  "Rajasthan": {
    roads: { name: "Public Works Department, Rajasthan", shortName: "PWD Rajasthan", email: "pwd.raj@gov.in" },
    water: { name: "Public Health Engineering Department", shortName: "PHED Rajasthan", email: "phed.raj@gov.in" },
    electricity: { name: "Jaipur Vidyut Vitran Nigam", shortName: "JVVNL", email: "jvvnl@raj.gov.in" },
    sanitation: { name: "Jaipur Municipal Corporation", shortName: "JMC", email: "jmc@rajasthan.gov.in" },
    "public-spaces": { name: "Jaipur Development Authority", shortName: "JDA", email: "jda@rajasthan.gov.in" },
    transportation: { name: "Rajasthan State Road Transport", shortName: "RSRTC", email: "rsrtc@rajasthan.gov.in" },
    other: { name: "Rajasthan Sampark Portal", shortName: "Sampark", email: "sampark@rajasthan.gov.in" }
  },
  
  // Generic fallback for other states
  "Arunachal Pradesh": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Assam": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Bihar": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Chhattisgarh": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Goa": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Haryana": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Himachal Pradesh": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Jharkhand": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Kerala": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Madhya Pradesh": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Manipur": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Meghalaya": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Mizoram": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Nagaland": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Odisha": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Punjab": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Sikkim": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Tripura": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Uttarakhand": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Andaman and Nicobar Islands": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Chandigarh": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Dadra and Nagar Haveli and Daman and Diu": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Jammu and Kashmir": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Ladakh": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Lakshadweep": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Puducherry": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
  "Unknown": { roads: defaultDepartment, water: defaultDepartment, electricity: defaultDepartment, sanitation: defaultDepartment, "public-spaces": defaultDepartment, transportation: defaultDepartment, other: defaultDepartment },
};

/**
 * Get department for a specific category and state
 */
export function getDepartment(category: IssueCategory, state: IndianState): Department {
  const stateDepts = stateDepartments[state];
  if (stateDepts && stateDepts[category]) {
    return stateDepts[category];
  }
  return defaultDepartment;
}

/**
 * Get department from pincode and category
 */
export function getDepartmentFromPincode(category: IssueCategory, pincode: string): { department: Department; state: IndianState | null } {
  const state = getStateFromPincode(pincode);
  if (state) {
    return { department: getDepartment(category, state), state };
  }
  return { department: defaultDepartment, state: null };
}

/**
 * Format department info for display
 */
export function formatDepartmentInfo(dept: Department): string {
  let info = dept.name;
  if (dept.phone) info += ` | Phone: ${dept.phone}`;
  if (dept.email) info += ` | Email: ${dept.email}`;
  return info;
}
