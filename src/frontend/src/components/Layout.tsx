import { cn } from "@/lib/utils";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Headphones,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  Monitor,
  QrCode,
  Sword,
  Trophy,
  UserCog,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../lib/auth";

const navItems = [
  {
    to: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard_link",
  },
  {
    to: "/admin/tournaments",
    label: "Tournaments",
    icon: Trophy,
    ocid: "nav.tournaments_link",
  },
  {
    to: "/admin/deposits",
    label: "Deposits",
    icon: ArrowDownCircle,
    ocid: "nav.deposits_link",
  },
  {
    to: "/admin/withdrawals",
    label: "Withdrawals",
    icon: ArrowUpCircle,
    ocid: "nav.withdrawals_link",
  },
  { to: "/admin/users", label: "Users", icon: Users, ocid: "nav.users_link" },
  { to: "/admin/hosts", label: "Hosts", icon: UserCog, ocid: "nav.hosts_link" },
  {
    to: "/admin/banners",
    label: "Banners",
    icon: Image,
    ocid: "nav.banners_link",
  },
  {
    to: "/admin/qrcode",
    label: "QR Code",
    icon: QrCode,
    ocid: "nav.qrcode_link",
  },
  {
    to: "/admin/support",
    label: "Support Settings",
    icon: Headphones,
    ocid: "nav.support_link",
  },
  {
    to: "/admin/splash",
    label: "Splash Screen",
    icon: Monitor,
    ocid: "nav.splash_link",
  },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 lg:hidden"
          onClick={closeSidebar}
          onKeyDown={(e) => e.key === "Escape" && closeSidebar()}
          role="button"
          tabIndex={0}
          aria-label="Close sidebar"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-sidebar border-r border-sidebar-border transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/20 border border-primary/40">
            <Sword className="w-5 h-5 text-primary" />
          </div>
          <span
            className="text-xl font-bold text-gradient-purple tracking-wider"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            LIFE BATTLE
          </span>
          <button
            type="button"
            className="ml-auto lg:hidden text-muted-foreground hover:text-foreground"
            onClick={closeSidebar}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto scrollbar-thin py-3 px-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              data-ocid={item.ocid}
              onClick={closeSidebar}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md mb-0.5 text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/30"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      "w-4 h-4 shrink-0",
                      isActive
                        ? "text-primary"
                        : "text-muted-foreground group-hover:text-sidebar-accent-foreground",
                    )}
                  />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="p-3 border-t border-sidebar-border">
          <button
            type="button"
            data-ocid="nav.logout_button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/20 hover:text-destructive transition-all duration-150"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 bg-card border-b border-border">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
          <span
            className="text-lg font-bold text-gradient-purple"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            LIFE BATTLE
          </span>
        </header>

        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
