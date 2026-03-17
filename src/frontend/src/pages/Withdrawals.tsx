import { onValue, ref, set } from "firebase/database";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "../lib/firebase";

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  upiId: string;
  status: "pending" | "approved" | "rejected";
  requestTime: string;
}

export default function WithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    const r = ref(db, "/withdrawals");
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      setWithdrawals(
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

  const approve = async (w: Withdrawal, idx: number) => {
    setProcessing(`approve_${idx}`);
    try {
      await set(ref(db, `/withdrawals/${w.id}/status`), "approved");
      toast.success("Withdrawal approved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setProcessing(null);
    }
  };

  const reject = async (w: Withdrawal, idx: number) => {
    setProcessing(`reject_${idx}`);
    try {
      await set(ref(db, `/withdrawals/${w.id}/status`), "rejected");
      toast.success("Withdrawal rejected");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div data-ocid="withdrawals.page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Withdrawals</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {withdrawals.length} total requests
        </p>
      </div>

      {loading ? (
        <div
          data-ocid="withdrawals.loading_state"
          className="flex justify-center py-12"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table data-ocid="withdrawals.table" className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "User ID",
                    "Amount",
                    "UPI ID",
                    "Status",
                    "Request Time",
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
                {withdrawals.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      data-ocid="withdrawals.empty_state"
                      className="text-center py-12 text-muted-foreground"
                    >
                      No withdrawal requests
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w, i) => (
                    <tr
                      key={w.id}
                      data-ocid={`withdrawals.item.${i + 1}`}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {w.userId}
                      </td>
                      <td className="px-4 py-3 font-semibold text-foreground">
                        ₹{w.amount}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {w.upiId}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize border ${
                            w.status === "approved"
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : w.status === "rejected"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {w.requestTime}
                      </td>
                      <td className="px-4 py-3">
                        {w.status === "pending" && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              data-ocid={`withdrawals.approve_button.${i + 1}`}
                              onClick={() => approve(w, i)}
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
                              data-ocid={`withdrawals.reject_button.${i + 1}`}
                              onClick={() => reject(w, i)}
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
