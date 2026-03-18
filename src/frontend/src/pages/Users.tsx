import { get, onValue, ref, set } from "firebase/database";
import { Loader2, MinusCircle, PlusCircle, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "../lib/firebase";

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  wallet: number;
  blocked: boolean;
}

interface WalletModal {
  user: User;
  type: "add" | "deduct";
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [walletModal, setWalletModal] = useState<WalletModal | null>(null);
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Read from /players path (your app's actual user path)
    const r = ref(db, "/players");
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      setUsers(
        Object.entries(data).map(([id, v]: [string, any]) => ({
          id,
          name: v?.name || v?.username || v?.displayName || "Unknown",
          email: v?.email || "",
          phone: v?.phone || v?.mobile || "",
          wallet: v?.wallet || v?.balance || v?.coins || 0,
          blocked: v?.blocked || v?.isBanned || false,
        })),
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.toLowerCase().includes(search.toLowerCase()),
  );

  const handleWallet = async () => {
    if (!walletModal || !amount) return;
    const val = Number(amount);
    if (Number.isNaN(val) || val <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    setSaving(true);
    try {
      const walletRef = ref(db, `/players/${walletModal.user.id}/wallet`);
      const snap = await get(walletRef);
      const current = snap.val() || 0;
      const newVal =
        walletModal.type === "add" ? current + val : Math.max(0, current - val);
      await set(walletRef, newVal);
      toast.success(
        `Wallet ${walletModal.type === "add" ? "credited" : "debited"} ₹${val}`,
      );
      setWalletModal(null);
      setAmount("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleBlock = async (u: User) => {
    try {
      await set(ref(db, `/players/${u.id}/blocked`), !u.blocked);
      toast.success(`User ${u.blocked ? "unblocked" : "blocked"}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div data-ocid="users.page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          {users.length} registered users
        </p>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          data-ocid="users.search_input"
          type="text"
          placeholder="Search by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {loading ? (
        <div
          data-ocid="users.loading_state"
          className="flex justify-center py-12"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table data-ocid="users.table" className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "User ID",
                    "Name",
                    "Email / Phone",
                    "Wallet",
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
                      data-ocid="users.empty_state"
                      className="text-center py-12 text-muted-foreground"
                    >
                      No users found
                    </td>
                  </tr>
                ) : (
                  filtered.map((u, i) => (
                    <tr
                      key={u.id}
                      data-ocid={`users.item.${i + 1}`}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {u.id.slice(0, 10)}...
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {u.name}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        <div>{u.email}</div>
                        {u.phone && (
                          <div className="text-muted-foreground/70">
                            {u.phone}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-semibold text-accent">
                        ₹{u.wallet}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                            u.blocked
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-green-500/20 text-green-400 border-green-500/30"
                          }`}
                        >
                          {u.blocked ? "Blocked" : "Active"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            data-ocid={`users.add_money_button.${i + 1}`}
                            onClick={() => {
                              setWalletModal({ user: u, type: "add" });
                              setAmount("");
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30 transition-all"
                          >
                            <PlusCircle className="w-3 h-3" /> Add
                          </button>
                          <button
                            type="button"
                            data-ocid={`users.deduct_button.${i + 1}`}
                            onClick={() => {
                              setWalletModal({ user: u, type: "deduct" });
                              setAmount("");
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 border border-orange-500/30 transition-all"
                          >
                            <MinusCircle className="w-3 h-3" /> Deduct
                          </button>
                          <button
                            type="button"
                            data-ocid={`users.block_toggle.${i + 1}`}
                            onClick={() => toggleBlock(u)}
                            className={`px-2 py-1 rounded text-xs border transition-all ${
                              u.blocked
                                ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                                : "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                            }`}
                          >
                            {u.blocked ? "Unblock" : "Block"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Wallet Modal */}
      {walletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            data-ocid="users.wallet_modal"
            className="bg-card border border-border rounded-xl w-full max-w-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">
                {walletModal.type === "add" ? "Add Money" : "Deduct Money"}
              </h2>
              <button
                type="button"
                onClick={() => setWalletModal(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-muted-foreground text-sm mb-4">
              User:{" "}
              <span className="text-foreground font-medium">
                {walletModal.user.name}
              </span>
            </p>
            <p className="text-muted-foreground text-sm mb-4">
              Current balance:{" "}
              <span className="text-accent font-semibold">
                ₹{walletModal.user.wallet}
              </span>
            </p>
            <input
              data-ocid="users.wallet_amount_input"
              type="number"
              min="1"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                data-ocid="users.wallet_cancel_button"
                onClick={() => setWalletModal(null)}
                className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted/20 text-muted-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="users.wallet_confirm_button"
                onClick={handleWallet}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-60 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
