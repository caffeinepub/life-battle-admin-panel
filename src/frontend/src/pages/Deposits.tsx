import { get, onValue, ref, set } from "firebase/database";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "../lib/firebase";

interface Deposit {
  id: string;
  userId: string;
  amount: number;
  screenshot: string;
  requestTime: string;
  status: "pending" | "approved" | "rejected";
}

type Filter = "All" | "pending" | "approved" | "rejected";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-400 border-green-500/30",
    rejected: "bg-red-500/20 text-red-400 border-red-500/30",
  };
  const cls = map[status] || "bg-muted/30 text-muted-foreground border-border";
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${cls}`}
    >
      {status}
    </span>
  );
}

export default function DepositsPage() {
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("All");
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const r = ref(db, "/deposits");
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      setDeposits(
        Object.entries(data)
          .map(([id, v]: [string, any]) => ({ id, ...v }))
          .sort(
            (a, b) =>
              new Date(b.requestTime).getTime() -
              new Date(a.requestTime).getTime(),
          ),
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const approve = async (d: Deposit, idx: number) => {
    setProcessing(`approve_${idx}`);
    try {
      // Update wallet in /players path
      const walletRef = ref(db, `/players/${d.userId}/wallet`);
      const snap = await get(walletRef);
      const current = snap.val() || 0;
      await set(walletRef, current + d.amount);
      await set(ref(db, `/deposits/${d.id}/status`), "approved");
      toast.success(`Approved ₹${d.amount} for user ${d.userId}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (d: Deposit, idx: number) => {
    setProcessing(`reject_${idx}`);
    try {
      await set(ref(db, `/deposits/${d.id}/status`), "rejected");
      toast.success("Deposit rejected");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const filtered =
    filter === "All" ? deposits : deposits.filter((d) => d.status === filter);
  const filters: Filter[] = ["All", "pending", "approved", "rejected"];

  return (
    <div data-ocid="deposits.page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Deposits</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {deposits.length} total requests
        </p>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            data-ocid={`deposits.${f.toLowerCase()}_tab`}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold capitalize transition-all ${
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div
          data-ocid="deposits.loading_state"
          className="flex justify-center py-12"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table data-ocid="deposits.table" className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "User ID",
                    "Amount",
                    "Screenshot",
                    "Request Time",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      data-ocid="deposits.empty_state"
                      className="text-center py-12 text-muted-foreground"
                    >
                      No deposits found
                    </td>
                  </tr>
                ) : (
                  filtered.map((d, i) => (
                    <tr
                      key={d.id}
                      data-ocid={`deposits.item.${i + 1}`}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {d.userId}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        ₹{d.amount}
                      </td>
                      <td className="px-4 py-3">
                        {d.screenshot ? (
                          <a
                            href={d.screenshot}
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline text-xs"
                          >
                            View
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {d.requestTime}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-4 py-3">
                        {d.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              data-ocid={`deposits.approve_button.${i + 1}`}
                              onClick={() => approve(d, i)}
                              disabled={!!processing}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 disabled:opacity-50 transition-all"
                            >
                              {processing === `approve_${i}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <CheckCircle className="w-3 h-3" />
                              )}
                              Approve
                            </button>
                            <button
                              type="button"
                              data-ocid={`deposits.reject_button.${i + 1}`}
                              onClick={() => reject(d, i)}
                              disabled={!!processing}
                              className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30 disabled:opacity-50 transition-all"
                            >
                              {processing === `reject_${i}` ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <XCircle className="w-3 h-3" />
                              )}
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
