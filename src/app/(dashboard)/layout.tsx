import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { DailyAnalysisTrigger } from "@/components/DailyAnalysisTrigger";
import { SidebarProvider } from "@/components/layout/SidebarContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden" style={{ background: "var(--color-canvas)" }}>
        <DailyAnalysisTrigger />
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <Topbar />
          <main className="flex-1 overflow-y-auto p-[14px_18px]">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
