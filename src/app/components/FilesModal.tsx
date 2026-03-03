"use client";

import { useCallback, useEffect, useState } from "react";

interface StorageItem {
  id: string;
  colleagueId: string;
  fileName: string;
  size: number;
  status: string;
  createdAt: string;
  url: string | null;
}

interface FilesModalProps {
  isOpen: boolean;
  colleagueId: string;
  colleagueName: string;
  onClose: () => void;
}

const MAX_SIZE_TEXT = "Maximaal uploadformaat volgens jouw instellingen.";

export const FilesModal = ({
  isOpen,
  colleagueId,
  colleagueName,
  onClose,
}: FilesModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/storage?colleague=${colleagueId}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        items?: StorageItem[];
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Kon bestanden niet ophalen.");
      }

      setItems(data.items ?? []);
    } catch (fetchError) {
      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "Er ging iets mis bij ophalen.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [colleagueId]);

  useEffect(() => {
    if (!isOpen) return;
    void fetchItems();
  }, [isOpen, fetchItems]);

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);
    setError(null);

    if (!file) {
      setStatus("Kies eerst een bestand.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("colleagueId", colleagueId);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as {
        error?: string;
        details?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Upload mislukt.");
      }

      setStatus("Bestand succesvol geupload naar Mistral.");
      setFile(null);
      await fetchItems();
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Er ging iets mis tijdens uploaden.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setStatus(null);
    setError(null);
    try {
      const response = await fetch(
        `/api/storage/${id}?colleague=${encodeURIComponent(colleagueId)}`,
        {
          method: "DELETE",
        },
      );
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Kon bestand niet verwijderen.");
      }

      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Er ging iets mis tijdens verwijderen.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#e4d8c7] bg-white shadow-2xl">
        <div className="sticky top-0 border-b border-[#e4d8c7] bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#1f1a12]">
                Bestanden van {colleagueName}
              </h2>
              <p className="mt-1 text-sm text-[#8a7b64]">
                Upload direct naar Mistral workspace
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[#8a7b64] hover:bg-[#f7f0e4] hover:text-[#1f1a12]"
              aria-label="Close"
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6">
          <form onSubmit={handleUpload} className="space-y-3">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-[#dabb7b] bg-[#fff7e5] px-6 py-8 text-center">
              <span className="rounded-full bg-white px-4 py-2 text-[#b17d1e] shadow">
                Bestand kiezen
              </span>
              <span className="text-xs font-medium text-[#6b5b46]">
                {file ? file.name : "Geen bestand gekozen"}
              </span>
              <input
                type="file"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            <p className="text-xs text-[#b6a58a]">{MAX_SIZE_TEXT}</p>
            <button
              type="submit"
              disabled={isUploading}
              className="rounded-2xl bg-[#1f1a12] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#433b31] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? "Uploaden..." : "Uploaden"}
            </button>
          </form>

          {status ? (
            <p className="text-sm font-medium text-green-700">{status}</p>
          ) : null}
          {error ? (
            <p className="rounded-xl border border-[#f3c4c1] bg-[#fff1f0] px-3 py-2 text-sm text-[#a83b2d]">
              {error}
            </p>
          ) : null}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[#a3927a]">
                Geuploade bestanden
              </h3>
              <button
                type="button"
                onClick={() => void fetchItems()}
                className="rounded-full border border-[#e4d8c7] bg-[#fff8eb] px-3 py-1 text-xs font-semibold text-[#6b5b46] hover:border-[#dabb7b]"
              >
                Vernieuwen
              </button>
            </div>

            {isLoading ? (
              <p className="text-sm text-[#8a7b64]">Bestanden laden...</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-[#8a7b64]">Nog geen bestanden gevonden.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-[#e4d8c7] bg-[#fffdf7] p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[#1f1a12]">
                        {item.fileName}
                      </p>
                      <p className="text-xs text-[#8a7b64]">
                        {(item.size / 1024 / 1024).toFixed(2)} MB · {item.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-[#e4d8c7] bg-white px-3 py-1 text-xs font-semibold text-[#6b5b46]"
                        >
                          Open
                        </a>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void handleDelete(item.id)}
                        disabled={deletingId === item.id}
                        className="rounded-full border border-[#f0d9d4] bg-[#fff3ef] px-3 py-1 text-xs font-semibold text-[#a83b2d] disabled:opacity-60"
                      >
                        {deletingId === item.id ? "..." : "Verwijder"}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

