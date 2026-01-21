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
    "description": "Potholes causing inconvenience to commuters.",
    "duration": "4-7 days",
    "image": "https://c.files.bbci.co.uk/97DE/production/_132287883_potholes.jpg",
    "location": "Bhigwan Road, Baramati",
    "timestamp": "2025-04-05T06:34:22.443Z",
    "title": "Potholes on Bhigwan Road"
  },
  "-ON3e4CmbyD4FWYszkbD": {
    "category": "sanitation",
    "description": "Overflowing garbage bins in the area.",
    "duration": "2-3 days",
    "image": "https://www.newagebd.com/files/records/news/202307/207434_186.jpg",
    "location": "Market Street, Pune",
    "timestamp": "2025-04-04T10:15:00.000Z",
    "title": "Garbage Overflow in Market Street"
  },
  "-ON3e4CmbyD4FWYszkbE": {
    "category": "electricity",
    "description": "Streetlights not working for the past week.",
    "duration": "7+ days",
    "image": "https://media.istockphoto.com/id/1076480852/photo/broken-street-lamp-in-city.jpg?s=612x612&w=0&k=20&c=MKylMMDuFgkXy7uUYog7oo7aQQ5ATyBqemfopYHYsKc=",
    "location": "MG Road, Mumbai",
    "timestamp": "2025-04-03T18:45:00.000Z",
    "title": "Non-functional Streetlights on MG Road"
  }
};

// Create and export the mockIssues array based on the dummyIssues object
export const mockIssues: Issue[] = Object.entries(dummyIssues).map(([id, data]) => {
  // Determine state based on location string
  let state: IndianState = "Unknown";
  if (data.location.includes("Baramati") || data.location.includes("Pune")) {
    state = "Maharashtra";
  } else if (data.location.includes("Mumbai")) {
    state = "Maharashtra";
  }
  
  return {
    id,
    title: data.title,
    description: data.description,
    category: data.category as IssueCategory,
    status: "reported" as IssueStatus,
    priority: "medium" as IssuePriority,
    location: {
      lat: 0,
      lng: 0,
      address: data.location,
      state: state,
      district: data.location.includes("Baramati") ? "Pune" : 
               data.location.includes("Pune") ? "Pune" : 
               data.location.includes("Mumbai") ? "Mumbai" : "",
      city: data.location.includes("Baramati") ? "Baramati" : 
            data.location.includes("Pune") ? "Pune" : 
            data.location.includes("Mumbai") ? "Mumbai" : "",
      village: ""
    },
    reportedBy: "user1",
    reportedAt: new Date(data.timestamp),
    images: data.image ? [data.image] : [],
    duration: data.duration,
    upvotes: Math.floor(Math.random() * 50), // Random upvotes for demo
    comments: []
  };
});
