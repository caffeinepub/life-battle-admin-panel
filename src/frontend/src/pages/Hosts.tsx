import { onValue, push, ref, remove } from "firebase/database";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "../lib/firebase";

interface Host {
  id: string;
  hostName: string;
  username: string;
  password: string;
  assignedTournaments: Record<string, boolean>;
}

const emptyForm = { hostName: "", username: "", password: "" };

export default function HostsPage() {
  const [hosts, setHosts] = useState<Host[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = ref(db, "/hosts");
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      setHosts(
        Object.entries(data).map(([id, v]: [string, any]) => ({ id, ...v })),
      );
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (
      !form.hostName.trim() ||
      !form.username.trim() ||
      !form.password.trim()
    ) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      await push(ref(db, "/hosts"), { ...form, assignedTournaments: {} });
      toast.success("Host created");
      setModalOpen(false);
      setForm(emptyForm);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (h: Host) => {
    if (!confirm(`Delete host "${h.hostName}"?`)) return;
    try {
      await remove(ref(db, `/hosts/${h.id}`));
      toast.success("Host deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const hostFields: [keyof typeof emptyForm, string][] = [
    ["hostName", "Host Name"],
    ["username", "Username"],
    ["password", "Password"],
  ];

  return (
    <div data-ocid="hosts.page">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hosts</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {hosts.length} hosts
          </p>
        </div>
        <button
          type="button"
          data-ocid="hosts.add_button"
          onClick={() => {
            setForm(emptyForm);
            setModalOpen(true);
          }}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold transition-all glow-purple"
        >
          <Plus className="w-4 h-4" /> Add Host
        </button>
      </div>

      {loading ? (
        <div
          data-ocid="hosts.loading_state"
          className="flex justify-center py-12"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table data-ocid="hosts.table" className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  {[
                    "Host Name",
                    "Username",
                    "Assigned Tournaments",
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
                {hosts.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      data-ocid="hosts.empty_state"
                      className="text-center py-12 text-muted-foreground"
                    >
                      No hosts found
                    </td>
                  </tr>
                ) : (
                  hosts.map((h, i) => (
                    <tr
                      key={h.id}
                      data-ocid={`hosts.item.${i + 1}`}
                      className="border-b border-border/50 hover:bg-muted/10 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        {h.hostName}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {h.username}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {Object.keys(h.assignedTournaments || {}).length}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          data-ocid={`hosts.delete_button.${i + 1}`}
                          onClick={() => handleDelete(h)}
                          className="p-1.5 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            data-ocid="host_form.modal"
            className="bg-card border border-border rounded-xl w-full max-w-md p-6"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Add Host</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              {hostFields.map(([key, label]) => (
                <div key={key}>
                  <label
                    htmlFor={`host-${key}`}
                    className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1"
                  >
                    {label}
                  </label>
                  <input
                    id={`host-${key}`}
                    type={key === "password" ? "password" : "text"}
                    value={form[key]}
                    onChange={(e) =>
                      setForm({ ...form, [key]: e.target.value })
                    }
                    className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                data-ocid="host_form.cancel_button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-md text-sm border border-border hover:bg-muted/20 text-muted-foreground transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                data-ocid="host_form.submit_button"
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold disabled:opacity-60 transition-all"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Host
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
