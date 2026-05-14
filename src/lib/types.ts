import type { Timestamp } from "firebase/firestore";

export interface WorkerProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  placeName: string;
  admin: boolean;
  photoURL?: string;
}

export interface WorkerWithAttendance extends WorkerProfile {
  checkIn: Timestamp | null;
  checkOut: Timestamp | null;
}

export type TaskStatus = "New" | "In progress" | "Delayed" | "Completed" | "Urgent";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  location: string;
  duration: number;
  status: TaskStatus;
  progress: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface AdminReport {
  userId: string;
  workerName: string;
  hotelName: string;
  date: string;
  note: string;
}

export type ComplaintSeverity = "low" | "medium" | "high";

export interface ComplaintItem {
  text: string;
  severity: ComplaintSeverity;
  hotelName: string;
  submitterName: string;
  date: string;
}

export interface HotelAnalysis {
  hotelName: string;
  emptyRooms: number;
  staffRooms: number;
  occupiedRooms: number;
  complaints: { text: string; severity: ComplaintSeverity }[];
}

export interface AnalysisResult {
  hotels: HotelAnalysis[];
  analysedAt: number;
}
