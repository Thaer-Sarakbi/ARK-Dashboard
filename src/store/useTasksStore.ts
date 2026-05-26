import { create } from "zustand";
import {
  collectionGroup,
  addDoc,
  collection,
  updateDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  type Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Task, TaskStatus } from "@/lib/types";

interface NewTaskInput {
  title: string;
  description: string;
  assignedTo: string;
  assignedToId: string;
  assignedBy: string;
  assignedById: string;
  location: string;
  duration: number;
}

interface TasksState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  subscribe: () => () => void;
  addTask: (input: NewTaskInput, assigneeUid: string) => Promise<void>;
  updateTaskStatus: (task: Task, status: TaskStatus, progress: number) => Promise<void>;
  clear: () => void;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  loading: false,
  error: null,

  subscribe: () => {
    set({ loading: true, error: null });

    const unsubscribe = onSnapshot(
      collectionGroup(db, "tasks"),
      (snapshot) => {
        const tasks = snapshot.docs
          .map((d) => {
            const pathSegments = d.ref.path.split("/");
            const userId = pathSegments[1];
            return {
              id: d.id,
              userId,
              ...(d.data() as Omit<Task, "id" | "userId">),
            } as Task;
          })
          .sort((a, b) => {
            const getMs = (t: Task) => {
              if (t.createdAt?.toMillis) return t.createdAt.toMillis();
              if (t.creationDate instanceof Date) return t.creationDate.getTime();
              if ((t.creationDate as Timestamp | undefined)?.toMillis) return (t.creationDate as Timestamp).toMillis();
              return 0;
            };
            return getMs(b) - getMs(a);
          });

        set({ tasks, loading: false });
      },
      (err) => {
        set({ error: err.message, loading: false });
      }
    );

    return unsubscribe;
  },

  addTask: async (input, assigneeUid) => {
    await addDoc(collection(db, "users", assigneeUid, "tasks"), {
      title: input.title,
      description: input.description,
      assignedTo: input.assignedTo,
      assignedToId: input.assignedToId,
      assignedBy: input.assignedBy,
      assignedById: input.assignedById,
      location: input.location,
      duration: input.duration,
      Status: "Not Started" as TaskStatus,
      creationDate: new Date(),
      updatedAt: serverTimestamp(),
    });
  },

  updateTaskStatus: async (task, status, progress) => {
    await updateDoc(doc(db, "users", task.userId, "tasks", task.id), {
      status,
      progress,
      updatedAt: serverTimestamp(),
    });
  },

  clear: () => set({ tasks: [], loading: false, error: null }),
}));
