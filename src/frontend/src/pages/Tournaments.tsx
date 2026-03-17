import { onValue, push, ref, remove, set } from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { db, storage } from "../lib/firebase";

interface Tournament {
  id: string;
  gameName: string;
  entryFee: number;
  prizePool: number;
  totalSlots: number;
  joinedSlots: number;
  matchTime: string;
  matchType: "Free" | "Paid";
  tournamentImage: string;
  roomId: string;
  roomPassword: string;
  status: "Active" | "Closed";
}

const empty: Omit<Tournament, "id"> = {
  gameName: "",
  entryFee: 0,
  prizePool: 0,
  totalSlots: 0,
  joinedSlots: 0,
  matchTime: "",
  matchType: "Free",
  tournamentImage: "",
  roomId: "",
  roomPassword: "",
  status: "Active",
};

type TextFields = "gameName" | "matchTime" | "roomId" | "roomPassword";
type NumFields = "entryFee" | "prizePool" | "totalSlots" | "joinedSlots";

const textFields: [TextFields, string][] = [
  ["gameName", "Game Name"],
  ["matchTime", "Match Time"],
  ["roomId", "Room ID"],
  ["roomPassword", "Room Password"],
];

const numFields: [NumFields, string][] = [
  ["entryFee", "Entry Fee (₹)"],
  ["prizePool", "Prize Pool (₹)"],
  ["totalSlots", "Total Slots"],
  ["joinedSlots", "Joined Slots"],
];

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Tournament | null>(null);
  const [form, setForm] = useState<Omit<Tournament, "id">>(empty);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const imageInputId = "tournament-image-input";

  useEffect(() => {
    const r = ref(db, "/tournaments");
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      setTournaments(
        Object.entries(data).map(([id, v]: [string, any]) => ({ id, ...v })),
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(empty);
    setImageFile(null);
    setImagePreview("");
    setModalOpen(true);
  };

  const openEdit = (t: Tournament) => {
    setEditing(t);
    const { id: _id, ...rest } = t;
    setForm(rest);
    setImagePreview(t.tournamentImage || "");
    setImageFile(null);
    setModalOpen(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.gameName.trim()) {
      toast.error("Game name is required");
      return;
    }
    setSaving(true);
    try {
      let imageUrl = form.tournamentImage;
      if (imageFile) {
        const path = `tournaments/${Date.now()}_${imageFile.name}`;
        const sRef = storageRef(storage, path);
        const snap = await uploadBytes(sRef, imageFile);
        imageUrl = await getDownloadURL(snap.ref);
      }
      const data = { ...form, tournamentImage: imageUrl };
      if (editing) {
        await set(ref(db, `/tournaments/${editing.id}`), data);
        toast.success("Tournament updated");
      } else {
        await push(ref(db, "/tournaments"), data);
        toast.success("Tournament created");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: Tournament) => {
    if (!confirm(`Delete tournament "${t.gameName}"?`)) return;
    try {
      await remove(ref(db, `/tournaments/${t.id}`));
      toast.success("Deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const toggleStatus = async (t: Tournament) => {
    const newStatus = t.status === "Active" ? "Closed" : "Active";
    try {
      await set(ref(db, `/tournaments/${t.id}/status`), newStatus);
      toast.success(`Tournament ${newStatus}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const filtered = tournaments.filter((t) =>
    t.gameName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div data-ocid="tournaments.page">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tournaments</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {tournaments.length} total
          </p>
        </div>
        <button
          type="button"
          data-ocid="tournaments.add_button"
          onClick={openAdd}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-all glow-purple"
        >
          <Plus className="w-4 h-4" /> Add Tournament
        </button>
      </div>

      <div className="relative mb-4 max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          data-ocid="tournaments.search_input"
          type="text"
          placeholder="Search by game name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-input border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {loading ? (
        <div
          data-ocid="tournaments.loading_state"
          className="flex justify-center py-12"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table data-ocid="tournaments.table" className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Game",
                    "Entry",
                    "Prize",
                    "Slots",
                    "Time",
                    "Type",
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
                      colSpan={8}
                      data-ocid="tournaments.empty_state"
                      className="text-center py-12 text-muted-foreground"
                    >
                      No tournaments found
                    </td>
                  </tr>
                ) : (
                  filtered.map((t, i) => (
                    <tr
                      key={t.id}
                      data-ocid={`tournaments.item.${i + 1}`}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {t.tournamentImage ? (
                            <img
                              src={t.tournamentImage}
                              alt=""
                              className="w-8 h-8 rounded object-cover border border-border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-muted border border-border" />
                          )}
                          <span className="font-medium text-foreground">
                            {t.gameName}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        ₹{t.entryFee}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        ₹{t.prizePool}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.joinedSlots}/{t.totalSlots}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {t.matchTime}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.matchType === "Free" ? "bg-accent/20 text-accent" : "bg-primary/20 text-primary"}`}
                        >
                          {t.matchType}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleStatus(t)}
                          className={`px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer border transition-all ${
                            t.status === "Active"
                              ? "bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30"
                          }`}
                        >
                          {t.status}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            data-ocid={`tournaments.edit_button.${i + 1}`}
                            onClick={() => openEdit(t)}
                            className="p-1.5 rounded-md hover:bg-primary/20 text-muted-foreground hover:text-primary transition-all"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            data-ocid={`tournaments.delete_button.${i + 1}`}
                            onClick={() => handleDelete(t)}
                            className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            data-ocid="tournament_form.modal"
            className="bg-card border border-border rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="text-lg font-bold">
                {editing ? "Edit Tournament" : "Add Tournament"}
              </h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {textFields.map(([key, label]) => (
                <div key={key}>
                  <label
                    htmlFor={`field-${key}`}
                    className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
                  >
                    {label}
                  </label>
                  <input
                    id={`field-${key}`}
                    type="text"
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
              {numFields.map(([key, label]) => (
                <div key={key}>
                  <label
                    htmlFor={`field-${key}`}
                    className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
                  >
                    {label}
                  </label>
                  <input
                    id={`field-${key}`}
                    type="number"
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: Number(e.target.value) })
                    }
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
              <div>
                <label
                  htmlFor="field-matchType"
                  className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
                >
                  Match Type
                </label>
                <select
                  id="field-matchType"
                  value={form.matchType}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      matchType: e.target.value as "Free" | "Paid",
                    })
                  }
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Free">Free</option>
                  <option value="Paid">Paid</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="field-status"
                  className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
                >
                  Status
                </label>
                <select
                  id="field-status"
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value as "Active" | "Closed",
                    })
                  }
                  className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="Active">Active</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
              <div className="sm:col-span-2">
                <p className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Tournament Image
                </p>
                <label
                  data-ocid="tournament_form.dropzone"
                  htmlFor={imageInputId}
                  className="block border-2 border-dashed border-border rounded-lg p-4 cursor-pointer hover:border-primary/50 transition-colors text-center"
                >
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Click to upload image
                    </p>
                  )}
                </label>
                <input
                  ref={fileRef}
                  id={imageInputId}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 px-6 pb-6">
              <button
                type="button"
                data-ocid="tournament_form.cancel_button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted/20 text-muted-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="tournament_form.submit_button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all glow-purple disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Tournament"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
