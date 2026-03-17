import { onValue, ref, set } from "firebase/database";
import { Loader2, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { db } from "../lib/firebase";

interface SupportSettings {
  whatsapp: string;
  telegram: string;
  email: string;
  message: string;
}

const defaultSettings: SupportSettings = {
  whatsapp: "",
  telegram: "",
  email: "",
  message: "",
};

export default function SupportPage() {
  const [form, setForm] = useState<SupportSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const r = ref(db, "/settings/support");
    const unsub = onValue(r, (snap) => {
      const data = snap.val();
      if (data) setForm({ ...defaultSettings, ...data });
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await set(ref(db, "/settings/support"), form);
      toast.success("Support settings saved");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div data-ocid="support.page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Support Settings</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Configure support contact information
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 max-w-xl">
        <div className="space-y-4">
          <div>
            <label
              htmlFor="support-whatsapp"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
            >
              WhatsApp Number
            </label>
            <input
              id="support-whatsapp"
              data-ocid="support.whatsapp_input"
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              placeholder="+91 9876543210"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label
              htmlFor="support-telegram"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
            >
              Telegram Link
            </label>
            <input
              id="support-telegram"
              data-ocid="support.telegram_input"
              type="text"
              value={form.telegram}
              onChange={(e) => setForm({ ...form, telegram: e.target.value })}
              placeholder="https://t.me/yourgrouplink"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label
              htmlFor="support-email"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
            >
              Support Email
            </label>
            <input
              id="support-email"
              data-ocid="support.email_input"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="support@lifebattle.gg"
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <div>
            <label
              htmlFor="support-message"
              className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5"
            >
              Support Message
            </label>
            <textarea
              id="support-message"
              data-ocid="support.message_textarea"
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Welcome to Life Battle support. How can we help you?"
              rows={4}
              className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>
        </div>
        <button
          type="button"
          data-ocid="support.save_button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 mt-6 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-md text-sm font-semibold disabled:opacity-60 transition-all glow-purple"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
