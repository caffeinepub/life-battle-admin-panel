import { onValue, ref, set } from "firebase/database";
import {
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { Loader2, QrCode, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { db, storage } from "../lib/firebase";

export default function QRCodePage() {
  const [currentUrl, setCurrentUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputId = "qr-file-input";
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const r = ref(db, "/settings/qrCode");
    const unsub = onValue(r, (snap) => {
      setCurrentUrl(snap.val() || "");
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const path = `settings/qrcode_${Date.now()}`;
      const sRef = storageRef(storage, path);
      const snap = await uploadBytes(sRef, selectedFile);
      const url = await getDownloadURL(snap.ref);
      await set(ref(db, "/settings/qrCode"), url);
      toast.success("QR Code updated");
      setPreview("");
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div data-ocid="qrcode.page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          QR Code Management
        </h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Upload payment QR code for deposit page
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Current QR Code
          </h2>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : currentUrl ? (
            <img
              src={currentUrl}
              alt="QR Code"
              className="w-48 h-48 mx-auto object-contain rounded-lg border border-border"
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
              <QrCode className="w-12 h-12 opacity-40" />
              <p className="text-sm">No QR code set</p>
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="text-sm font-semibold text-foreground mb-3">
            Upload New QR Code
          </h2>
          <label
            data-ocid="qrcode.dropzone"
            htmlFor={fileInputId}
            className="block border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors text-center mb-4"
          >
            {preview ? (
              <img
                src={preview}
                alt="preview"
                className="w-40 h-40 mx-auto object-contain rounded-lg"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <QrCode className="w-8 h-8" />
                <p className="text-sm">Click to select QR image</p>
              </div>
            )}
          </label>
          <input
            ref={fileRef}
            id={fileInputId}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          {selectedFile && (
            <button
              type="button"
              data-ocid="qrcode.upload_button"
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-2 w-full justify-center bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-60 transition-all glow-purple"
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? "Uploading..." : "Update QR Code"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
