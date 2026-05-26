import { attendancePillClass, statusPillClass, severityPillClass } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

type BadgeVariant =
  | "Present"
  | "Absent"
  | TaskStatus
  | "low"
  | "medium"
  | "high";

function getClass(status: BadgeVariant): string {
  if (status === "Present" || status === "Absent")
    return attendancePillClass(status);
  if (status === "low" || status === "medium" || status === "high")
    return severityPillClass(status);
  return statusPillClass(status as TaskStatus);
}

export function StatusBadge({ status }: { status: BadgeVariant }) {
  return (
    <span
      className={`inline-flex items-center gap-[3px] px-[7px] py-[2px] rounded-full text-[10px] font-medium ${getClass(status)}`}
    >
      {status}
    </span>
  );
}
