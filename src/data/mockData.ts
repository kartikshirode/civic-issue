import { Issue, IssueCategory, IssuePriority, IssueStatus } from "@/types";
import { IndianState } from "@/types/location";
import { ref, get } from "firebase/database";
import { db } from "../lib/utils";

export async function fetchIssues() {
  const issuesRef = ref(db, "issues");
  const snapshot = await get(issuesRef);
  if (snapshot.exists()) {
    const data = snapshot.val();
    return Array.isArray(data) ? data : Object.values(data);
  } else {
    return [];
  }
}

export const categoryOptions: { value: IssueCategory; label: string }[] = [
  { value: "roads", label: "Roads & Sidewalks" },
  { value: "water", label: "Water Services" },
  { value: "electricity", label: "Electricity & Lighting" },
  { value: "sanitation", label: "Sanitation & Waste" },
  { value: "public-spaces", label: "Public Spaces" },
  { value: "transportation", label: "Public Transportation" },
  { value: "other", label: "Other" }
];

export const statusOptions: { value: IssueStatus; label: string; color: string }[] = [
  { value: "reported", label: "Reported", color: "bg-yellow-500" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-500" },
  { value: "resolved", label: "Resolved", color: "bg-green-500" },
  { value: "closed", label: "Closed", color: "bg-gray-500" }
];

export const priorityOptions: { value: IssuePriority; label: string; color: string }[] = [
  { value: "low", label: "Low", color: "bg-blue-300" },
  { value: "medium", label: "Medium", color: "bg-yellow-300" },
  { value: "high", label: "High", color: "bg-orange-400" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" }
];

export const durationOptions: string[] = [
  "Less than 24 hours",
  "1-3 days",
  "4-7 days",
  "1-2 weeks",
  "2-4 weeks",
  "1-3 months",
  "3-6 months",
  "More than 6 months"
];

// Dummy issues added to Firebase Realtime Database JSON structure for testing purposes
const dummyIssues = {
  "-ON3e4CmbyD4FWYszkbC": {
    "category": "roads",
    "description": "Potholes causing inconvenience to commuters. Multiple deep potholes on the main road making it dangerous for two-wheelers.",
    "duration": "1-3 months",
    "image": "https://c.files.bbci.co.uk/97DE/production/_132287883_potholes.jpg",
    "location": "Bhigwan Road, Baramati",
    "pincode": "413102",
    "timestamp": "2025-04-05T06:34:22.443Z",
    "title": "Potholes on Bhigwan Road",
    "upvotes": 47,
    "department": "Public Works Department, Maharashtra",
    "departmentShortName": "PWD Maharashtra"
  },
  "-ON3e4CmbyD4FWYszkbD": {
    "category": "sanitation",
    "description": "Overflowing garbage bins in the area causing health hazards. The municipal workers haven't collected garbage for 5 days.",
    "duration": "4-7 days",
    "image": "https://www.newagebd.com/files/records/news/202307/207434_186.jpg",
    "location": "Market Street, Pune",
    "pincode": "411001",
    "timestamp": "2025-04-04T10:15:00.000Z",
    "title": "Garbage Overflow in Market Street",
    "upvotes": 32,
    "department": "Maharashtra Pollution Control Board",
    "departmentShortName": "MPCB"
  },
  "-ON3e4CmbyD4FWYszkbE": {
    "category": "electricity",
    "description": "Streetlights not working for the past week causing safety concerns for pedestrians and motorists at night.",
    "duration": "1-2 weeks",
    "image": "https://media.istockphoto.com/id/1076480852/photo/broken-street-lamp-in-city.jpg",
    "location": "MG Road, Mumbai",
    "pincode": "400001",
    "timestamp": "2025-04-03T18:45:00.000Z",
    "title": "Non-functional Streetlights on MG Road",
    "upvotes": 89,
    "department": "Maharashtra State Electricity Distribution Co. Ltd",
    "departmentShortName": "MSEDCL"
  },
  "-ON3e4CmbyD4FWYszkbF": {
    "category": "water",
    "description": "Water pipeline burst causing water wastage and flooding on the street. The issue has been reported multiple times but no action taken.",
    "duration": "2-4 weeks",
    "image": "https://images.unsplash.com/photo-1584824486509-112e4181ff6b?w=800",
    "location": "Connaught Place, Delhi",
    "pincode": "110001",
    "timestamp": "2025-04-02T09:30:00.000Z",
    "title": "Water Pipeline Burst at Connaught Place",
    "upvotes": 124,
    "department": "Delhi Jal Board",
    "departmentShortName": "DJB"
  },
  "-ON3e4CmbyD4FWYszkbG": {
    "category": "public-spaces",
    "description": "Park equipment broken and unsafe for children. Swings are rusty and slides have sharp edges.",
    "duration": "1-3 months",
    "image": "https://images.unsplash.com/photo-1564429238980-16e365e0d21d?w=800",
    "location": "Cubbon Park, Bangalore",
    "pincode": "560001",
    "timestamp": "2025-04-01T14:20:00.000Z",
    "title": "Broken Play Equipment in Cubbon Park",
    "upvotes": 56,
    "department": "Bruhat Bengaluru Mahanagara Palike",
    "departmentShortName": "BBMP"
  },
  "-ON3e4CmbyD4FWYszkbH": {
    "category": "transportation",
    "description": "Traffic signal not working at major intersection causing traffic jams and accidents during peak hours.",
    "duration": "4-7 days",
    "image": "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=800",
    "location": "Anna Salai, Chennai",
    "pincode": "600002",
    "timestamp": "2025-03-30T11:00:00.000Z",
    "title": "Malfunctioning Traffic Signal at Anna Salai",
    "upvotes": 78,
    "department": "Metropolitan Transport Corporation Chennai",
    "departmentShortName": "MTC"
  },
  "-ON3e4CmbyD4FWYszkbI": {
    "category": "roads",
    "description": "Large crater-like pothole developed after recent rains. Several vehicles have been damaged.",
    "duration": "1-2 weeks",
    "image": "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800",
    "location": "Jubilee Hills, Hyderabad",
    "pincode": "500033",
    "timestamp": "2025-03-28T08:45:00.000Z",
    "title": "Dangerous Pothole in Jubilee Hills",
    "upvotes": 145,
    "department": "Roads & Buildings Department, Telangana",
    "departmentShortName": "R&B Telangana"
  },
  "-ON3e4CmbyD4FWYszkbJ": {
    "category": "water",
    "description": "No water supply for the past 3 days. Residents are forced to buy water tankers at high prices.",
    "duration": "1-3 days",
    "image": "https://images.unsplash.com/photo-1584822857614-dfc4844c7eb0?w=800",
    "location": "Gomti Nagar, Lucknow",
    "pincode": "226010",
    "timestamp": "2025-03-27T07:30:00.000Z",
    "title": "Water Supply Disruption in Gomti Nagar",
    "upvotes": 203,
    "department": "UP Jal Nigam",
    "departmentShortName": "UPJN"
  },
  "-ON3e4CmbyD4FWYszkbK": {
    "category": "sanitation",
    "description": "Open drain overflowing causing foul smell and mosquito breeding. Health hazard for nearby residents.",
    "duration": "2-4 weeks",
    "image": "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800",
    "location": "Salt Lake, Kolkata",
    "pincode": "700091",
    "timestamp": "2025-03-25T16:00:00.000Z",
    "title": "Open Drain Overflow in Salt Lake",
    "upvotes": 67,
    "department": "Kolkata Municipal Corporation",
    "departmentShortName": "KMC"
  },
  "-ON3e4CmbyD4FWYszkbL": {
    "category": "electricity",
    "description": "Exposed live wires hanging dangerously low near school area. Immediate attention required to prevent accidents.",
    "duration": "Less than 24 hours",
    "image": "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800",
    "location": "MI Road, Jaipur",
    "pincode": "302001",
    "timestamp": "2025-03-24T12:15:00.000Z",
    "title": "Dangerous Exposed Wires on MI Road",
    "upvotes": 312,
    "department": "Jaipur Vidyut Vitran Nigam",
    "departmentShortName": "JVVNL"
  },
  "-ON3e4CmbyD4FWYszkbM": {
    "category": "public-spaces",
    "description": "Footpath completely blocked by illegal vendors. Pedestrians forced to walk on the road risking accidents.",
    "duration": "3-6 months",
    "image": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
    "location": "CG Road, Ahmedabad",
    "pincode": "380006",
    "timestamp": "2025-03-22T10:30:00.000Z",
    "title": "Footpath Encroachment on CG Road",
    "upvotes": 45,
    "department": "Ahmedabad Municipal Corporation",
    "departmentShortName": "AMC"
  },
  "-ON3e4CmbyD4FWYszkbN": {
    "category": "transportation",
    "description": "Bus shelter collapsed after storm. No alternative shelter for commuters waiting in sun and rain.",
    "duration": "1-2 weeks",
    "image": "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800",
    "location": "Viman Nagar, Pune",
    "pincode": "411014",
    "timestamp": "2025-03-20T09:00:00.000Z",
    "title": "Collapsed Bus Shelter in Viman Nagar",
    "upvotes": 28,
    "department": "Maharashtra State Road Transport Corporation",
    "departmentShortName": "MSRTC"
  },
  "-ON3e4CmbyD4FWYszkbO": {
    "category": "other",
    "description": "Stray dog menace in the colony. Pack of aggressive strays attacking morning walkers and children.",
    "duration": "1-3 months",
    "image": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800",
    "location": "Indiranagar, Bangalore",
    "pincode": "560038",
    "timestamp": "2025-03-18T06:45:00.000Z",
    "title": "Stray Dog Menace in Indiranagar",
    "upvotes": 156,
    "department": "Bruhat Bengaluru Mahanagara Palike",
    "departmentShortName": "BBMP"
  },
  "-ON3e4CmbyD4FWYszkbP": {
    "category": "roads",
    "description": "Road caved in after heavy construction work nearby. Deep hole blocking half the road.",
    "duration": "4-7 days",
    "image": "https://images.unsplash.com/photo-1545558014-8692077e9b5c?w=800",
    "location": "Sector 17, Chandigarh",
    "pincode": "160017",
    "timestamp": "2025-03-15T14:30:00.000Z",
    "title": "Road Cave-in at Sector 17",
    "upvotes": 89,
    "department": "Municipal Corporation",
    "departmentShortName": "MC"
  },
  "-ON3e4CmbyD4FWYszkbQ": {
    "category": "water",
    "description": "Contaminated water supply with yellowish color and bad smell. Multiple residents falling sick.",
    "duration": "1-2 weeks",
    "image": "https://images.unsplash.com/photo-1562016600-ece13e8ba570?w=800",
    "location": "Bandra West, Mumbai",
    "pincode": "400050",
    "timestamp": "2025-03-12T08:00:00.000Z",
    "title": "Contaminated Water in Bandra West",
    "upvotes": 267,
    "department": "Maharashtra Jeevan Pradhikaran",
    "departmentShortName": "MJP"
  }
};

// Helper to determine state from location and pincode
function getStateFromLocation(location: string, pincode?: string): IndianState {
  const locationLower = location.toLowerCase();
  
  if (locationLower.includes("baramati") || locationLower.includes("pune") || locationLower.includes("mumbai") || locationLower.includes("viman nagar") || locationLower.includes("bandra")) {
    return "Maharashtra";
  } else if (locationLower.includes("delhi") || locationLower.includes("connaught")) {
    return "Delhi";
  } else if (locationLower.includes("bangalore") || locationLower.includes("bengaluru") || locationLower.includes("cubbon") || locationLower.includes("indiranagar")) {
    return "Karnataka";
  } else if (locationLower.includes("chennai") || locationLower.includes("anna salai")) {
    return "Tamil Nadu";
  } else if (locationLower.includes("hyderabad") || locationLower.includes("jubilee hills")) {
    return "Telangana";
  } else if (locationLower.includes("lucknow") || locationLower.includes("gomti nagar")) {
    return "Uttar Pradesh";
  } else if (locationLower.includes("kolkata") || locationLower.includes("salt lake")) {
    return "West Bengal";
  } else if (locationLower.includes("jaipur") || locationLower.includes("mi road")) {
    return "Rajasthan";
  } else if (locationLower.includes("ahmedabad") || locationLower.includes("cg road")) {
    return "Gujarat";
  } else if (locationLower.includes("chandigarh") || locationLower.includes("sector 17")) {
    return "Chandigarh";
  }
  
  return "Unknown";
}

// Create and export the mockIssues array based on the dummyIssues object
export const mockIssues: Issue[] = Object.entries(dummyIssues).map(([id, data]: [string, any]) => {
  const state = getStateFromLocation(data.location, data.pincode);
  
  return {
    id,
    title: data.title,
    description: data.description,
    category: data.category as IssueCategory,
    status: "reported" as IssueStatus,
    priority: data.upvotes > 200 ? "urgent" as IssuePriority : 
              data.upvotes > 100 ? "high" as IssuePriority : 
              data.upvotes > 50 ? "medium" as IssuePriority : "low" as IssuePriority,
    location: {
      lat: 0,
      lng: 0,
      address: data.location,
      state: state,
      pincode: data.pincode,
      district: "",
      city: data.location.split(",")[0].trim(),
      village: ""
    },
    reportedBy: "user" + Math.floor(Math.random() * 100),
    reportedAt: new Date(data.timestamp),
    images: data.image ? [data.image] : [],
    duration: data.duration,
    upvotes: data.upvotes || Math.floor(Math.random() * 50),
    comments: [],
    department: data.department,
    departmentShortName: data.departmentShortName,
    departmentStatus: "pending"
  };
});
