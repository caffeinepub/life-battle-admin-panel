import { onValue, ref, update } from "firebase/database";
import { Eye, EyeOff, Loader2, Lock, Trophy } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getHostSession } from "../lib/auth";
import { db } from "../lib/firebase";

interface Tournament {
  id: string;
  gameName: string;
  entryFee: number;
  prizePool: number;
  totalSlots: number;
  joinedSlots: number;
  matchTime: string;
  matchType: string;
  roomId: string;
  roomPassword: string;
  status: string;
  tournamentImage?: string;
}

export default function HostDashboard() {
  const session = getHostSession();
  const hostName = session?.hostName ?? "";
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState<Tournament | null>(null);
  const [roomId, setRoomId] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = ref(db, "/tournaments");
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      const all: Tournament[] = Object.entries(data).map(
        ([id, v]: [string, any]) => ({ id, ...v }),
      );
      setTournaments(all);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openEdit = (t: Tournament) => {
    setEditModal(t);
    setRoomId(t.roomId || "");
    setRoomPassword(t.roomPassword || "");
    setShowPass(false);
  };

  const handleSave = async () => {
    if (!editModal) return;
    setSaving(true);
    try {
      await update(ref(db, `/tournaments/${editModal.id}`), {
        roomId,
        roomPassword,
      });
      toast.success("Room details updated");
      setEditModal(null);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (t: Tournament) => {
    const newStatus = t.status === "Active" ? "Closed" : "Active";
    try {
      await update(ref(db, `/tournaments/${t.id}`), { status: newStatus });
      toast.success(
        `Tournament ${newStatus === "Active" ? "opened" : "closed"}`,
      );
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Trophy className="w-6 h-6 text-primary" />
          My Tournaments
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Welcome, {hostName}. You can update room details and toggle tournament
          status.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : tournaments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No tournaments found.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3"
            >
              {t.tournamentImage && (
                <img
                  src={t.tournamentImage}
                  alt={t.gameName}
                  className="w-full h-32 object-cover rounded-lg"
                />
              )}
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">
                    {t.gameName}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t.matchTime}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.status === "Active"
                      ? "bg-green-500/15 text-green-400"
                      : "bg-red-500/15 text-red-400"
                  }`}
                >
                  {t.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-muted/20 rounded px-2 py-1.5">
                  <span className="text-muted-foreground">Entry</span>
                  <div className="font-semibold text-foreground">
                    ₹{t.entryFee}
                  </div>
                </div>
                <div className="bg-muted/20 rounded px-2 py-1.5">
                  <span className="text-muted-foreground">Prize</span>
                  <div className="font-semibold text-foreground">
                    ₹{t.prizePool}
                  </div>
                </div>
                <div className="bg-muted/20 rounded px-2 py-1.5">
                  <span className="text-muted-foreground">Slots</span>
                  <div className="font-semibold text-foreground">
                    {t.joinedSlots}/{t.totalSlots}
                  </div>
                </div>
                <div className="bg-muted/20 rounded px-2 py-1.5">
                  <span className="text-muted-foreground">Type</span>
                  <div className="font-semibold text-foreground">
                    {t.matchType}
                  </div>
                </div>
              </div>
              <div className="text-xs bg-muted/10 border border-border rounded px-3 py-2 space-y-1">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>
                    Room ID:{" "}
                    <span className="text-foreground font-mono">
                      {t.roomId || "Not set"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>
                    Password:{" "}
                    <span className="text-foreground font-mono">
                      {t.roomPassword || "Not set"}
                    </span>
                  </span>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => openEdit(t)}
                  className="flex-1 py-1.5 text-xs rounded-md border border-primary/40 text-primary hover:bg-primary/10 font-semibold transition-all"
                >
                  Update Room
                </button>
                <button
                  type="button"
                  onClick={() => toggleStatus(t)}
                  className={`flex-1 py-1.5 text-xs rounded-md font-semibold transition-all ${
                    t.status === "Active"
                      ? "border border-red-500/40 text-red-400 hover:bg-red-500/10"
                      : "border border-green-500/40 text-green-400 hover:bg-green-500/10"
                  }`}
                >
                  {t.status === "Active" ? "Close" : "Open"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-card border border-border rounded-xl w-full max-w-sm p-6">
            <h2 className="text-lg font-bold mb-4">Update Room Details</h2>
            <p className="text-sm text-muted-foreground mb-4">
              {editModal.gameName}
            </p>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="host-room-id"
                  className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
                >
                  Room ID
                </label>
                <input
                  id="host-room-id"
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label
                  htmlFor="host-room-password"
                  className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
                >
                  Room Password
                </label>
                <div className="relative">
                  <input
                    id="host-room-password"
                    type={showPass ? "text" : "password"}
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    className="w-full bg-input border border-border rounded-md px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditModal(null)}
                className="flex-1 py-2 rounded-md text-sm border border-border text-muted-foreground hover:bg-muted/20 transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-60 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
