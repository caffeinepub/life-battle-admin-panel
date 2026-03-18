import { onValue, ref } from "firebase/database";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { db } from "../lib/firebase";

interface Stats {
  users: number;
  tournaments: number;
  deposits: number;
  withdrawals: number;
  walletBalance: number;
}

const initialStats: Stats = {
  users: 0,
  tournaments: 0,
  deposits: 0,
  withdrawals: 0,
  walletBalance: 0,
};

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  ocid,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  ocid: string;
}) {
  return (
    <div
      data-ocid={ocid}
      className="bg-card border border-border rounded-xl p-5 relative overflow-hidden group hover:border-primary/30 transition-all duration-200"
    >
      <div
        className="absolute top-0 right-0 w-24 h-24 opacity-5 rounded-full -translate-y-6 translate-x-6"
        style={{ background: color }}
      />
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">
            {label}
          </p>
          <p
            className="text-3xl font-bold text-foreground"
            style={{ fontFamily: "Rajdhani, sans-serif" }}
          >
            {typeof value === "number" && label.includes("Balance")
              ? `₹${value.toLocaleString()}`
              : value.toLocaleString()}
          </p>
        </div>
        <div
          className="flex items-center justify-center w-11 h-11 rounded-lg border"
          style={{ background: `${color}20`, borderColor: `${color}40` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
        <TrendingUp className="w-3 h-3" />
        <span>Real-time data</span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>(initialStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubs: (() => void)[] = [];
    const current: Stats = { ...initialStats };
    let loaded = 0;
    const checkLoaded = () => {
      loaded++;
      if (loaded >= 4) setLoading(false);
    };

    // Read playerCount directly, and players for wallet balance
    unsubs.push(
      onValue(ref(db, "/playerCount"), (snap) => {
        const count = snap.val();
        if (count !== null && typeof count === "number") {
          current.users = count;
        } else {
          // fallback: count from /players node
          current.users = 0;
        }
        setStats({ ...current });
        checkLoaded();
      }),
    );

    // Wallet balance from /players
    unsubs.push(
      onValue(ref(db, "/players"), (snap) => {
        const data = snap.val() || {};
        current.walletBalance = Object.values(data).reduce(
          (sum: number, u: any) => sum + (u?.wallet || u?.balance || 0),
          0,
        );
        setStats({ ...current });
      }),
    );

    unsubs.push(
      onValue(ref(db, "/tournaments"), (snap) => {
        current.tournaments = Object.keys(snap.val() || {}).length;
        setStats({ ...current });
        checkLoaded();
      }),
    );

    unsubs.push(
      onValue(ref(db, "/deposits"), (snap) => {
        current.deposits = Object.keys(snap.val() || {}).length;
        setStats({ ...current });
        checkLoaded();
      }),
    );

    unsubs.push(
      onValue(ref(db, "/withdrawals"), (snap) => {
        current.withdrawals = Object.keys(snap.val() || {}).length;
        setStats({ ...current });
        checkLoaded();
      }),
    );

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  const cards = [
    {
      label: "Total Users",
      value: stats.users,
      icon: Users,
      color: "oklch(0.82 0.14 200)",
      ocid: "dashboard.users_card",
    },
    {
      label: "Total Tournaments",
      value: stats.tournaments,
      icon: Trophy,
      color: "oklch(0.58 0.22 290)",
      ocid: "dashboard.tournaments_card",
    },
    {
      label: "Total Deposits",
      value: stats.deposits,
      icon: ArrowDownCircle,
      color: "oklch(0.72 0.18 142)",
      ocid: "dashboard.deposits_card",
    },
    {
      label: "Total Withdrawals",
      value: stats.withdrawals,
      icon: ArrowUpCircle,
      color: "oklch(0.78 0.16 55)",
      ocid: "dashboard.withdrawals_card",
    },
    {
      label: "Total Wallet Balance",
      value: stats.walletBalance,
      icon: Wallet,
      color: "oklch(0.72 0.22 330)",
      ocid: "dashboard.wallet_card",
    },
  ];

  return (
    <div data-ocid="dashboard.page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Real-time overview of Life Battle platform
        </p>
      </div>

      {loading ? (
        <div
          data-ocid="dashboard.loading_state"
          className="flex items-center gap-3 text-muted-foreground py-12 justify-center"
        >
          <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          Loading stats...
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
          {cards.map((c) => (
            <StatCard key={c.ocid} {...c} />
          ))}
        </div>
      )}
    </div>
  );
}
