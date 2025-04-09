import { useState } from "react";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";

interface DashboardLayoutProps {
    children: React.ReactNode;
    title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Mock user data - replace with actual user data later
    const user = {
        name: "John Doe",
        email: "john@example.com",
        image: "/api/placeholder/32/32",
    };

    const handleLogout = () => {
        // Implement logout logic
        console.log("Logging out...");
    };

    return (
        <div className="flex h-screen">
            <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed(!isCollapsed)} />
            <div className="flex flex-1 flex-col">
                <Header title={title} user={user} onLogout={handleLogout} />
                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>
        </div>
    );
}