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
  nightCheckIn: Timestamp | null;
  nightCheckOut: Timestamp | null;
}

export type TaskStatus = "Not Started" | "In progress" | "Completed" | "Delayed" | "Urgent";

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedToId?: string;
  assignedBy: string;
  assignedById?: string;
  location: string;
  duration: number;
  Status?: TaskStatus;
  status?: TaskStatus;
  progress?: number;
  creationDate?: Timestamp | Date;
  createdAt?: Timestamp;
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

export interface RoomStatusDoc {
  id: string;
  hotel: string;
  emptyRooms: number;
  staffRooms: number;
  occupiedRooms: number;
  analyzedAt: Timestamp | null;
}

export interface ComplaintDoc {
  id: string;
  text: string;
  severity: ComplaintSeverity;
  hotel: string;
  submittedBy: string;
  analyzedAt: Timestamp | null;
}
