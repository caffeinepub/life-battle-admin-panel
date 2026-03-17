import { onValue, push, ref, remove } from "firebase/database";
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { db, storage } from "../lib/firebase";

interface Banner {
  id: string;
  url: string;
  storagePath: string;
}

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputId = "banner-file-input";
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const r = ref(db, "/banners");
    const unsub = onValue(r, (snap) => {
      const data = snap.val() || {};
      setBanners(
        Object.entries(data).map(([id, v]: [string, any]) => ({ id, ...v })),
      );
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
      const path = `banners/${Date.now()}_${selectedFile.name}`;
      const sRef = storageRef(storage, path);
      const snap = await uploadBytes(sRef, selectedFile);
      const url = await getDownloadURL(snap.ref);
      await push(ref(db, "/banners"), { url, storagePath: path });
      toast.success("Banner uploaded");
      setPreview(null);
      setSelectedFile(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (b: Banner) => {
    if (!confirm("Delete this banner?")) return;
    try {
      if (b.storagePath) {
        try {
          await deleteObject(storageRef(storage, b.storagePath));
        } catch (_e) {
          // ignore if already deleted
        }
      }
      await remove(ref(db, `/banners/${b.id}`));
      toast.success("Banner deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div data-ocid="banners.page">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Banners</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {banners.length} banners
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5 mb-6">
        <h2 className="text-sm font-semibold text-foreground mb-3">
          Upload New Banner
        </h2>
        <label
          data-ocid="banners.dropzone"
          htmlFor={fileInputId}
          className="block border-2 border-dashed border-border rounded-lg p-6 cursor-pointer hover:border-primary/50 transition-colors text-center mb-4"
        >
          {preview ? (
            <img
              src={preview}
              alt="preview"
              className="max-h-40 mx-auto rounded-lg object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="w-8 h-8" />
              <p className="text-sm">Click to select banner image</p>
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
            data-ocid="banners.upload_button"
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-semibold disabled:opacity-60 transition-all glow-purple"
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {uploading ? "Uploading..." : "Upload Banner"}
          </button>
        )}
      </div>

      {loading ? (
        <div
          data-ocid="banners.loading_state"
          className="flex justify-center py-12"
        >
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : banners.length === 0 ? (
        <div
          data-ocid="banners.empty_state"
          className="text-center py-12 text-muted-foreground"
        >
          No banners uploaded yet
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {banners.map((b, i) => (
            <div
              key={b.id}
              data-ocid={`banners.item.${i + 1}`}
              className="bg-card border border-border rounded-xl overflow-hidden group relative"
            >
              <img
                src={b.url}
                alt="banner"
                className="w-full h-36 object-cover"
              />
              <button
                type="button"
                data-ocid={`banners.delete_button.${i + 1}`}
                onClick={() => handleDelete(b)}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-black/60 text-white hover:bg-destructive transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
