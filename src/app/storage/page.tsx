"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PdfPreviewModal } from "../components/PdfPreviewModal";

interface UploadResponse {
  item?: StorageItem;
  error?: string;
}

interface StorageItem {
  id: string;
  colleagueId: string;
  fileName: string;
  blobPath: string;
  blobUrl: string;
  size: number;
  contentType: string;
  openaiFileId: string;
  vectorStoreId: string;
  status: "PENDING" | "READY" | "FAILED";
  createdAt: string;
  updatedAt: string;
}

const colleagues = [
  {
    id: "hnab",
    name: "HN-AB",
    title: "Algemeen",
    avatar: "/inc-logo.png",
    enabled: true,
  },
  {
    id: "claire",
    name: "Claire",
    title: "Re-integratie & jobcoaching",
    avatar: "/claire.jpg",
    enabled: true,
  },
  {
    id: "tom",
    name: "Tom",
    title: "Online & SEO",
    avatar: "/tom.jpg",
    enabled: true,
  },
  {
    id: "remco",
    name: "Remco",
    title: "Tender & sales",
    avatar: "/remco.jpg",
    enabled: true,
  },
  {
    id: "roos",
    name: "Roos",
    title: "Marketing & communicatie",
    avatar: "/roos.jpg",
    enabled: true,
  },
];

const MAX_SIZE_TEXT = "Maximaal 25MB per bestand. PDF, TXT en Markdown toegestaan.";

export default function StoragePage() {
  const defaultColleague =
    colleagues.find(
      (colleague) => colleague.id === "hnab" && colleague.enabled,
    )?.id ??
    colleagues.find((colleague) => colleague.enabled)?.id ??
    colleagues[0].id;

  const [file, setFile] = useState<File | null>(null);
  const [selectedColleague, setSelectedColleague] = useState(defaultColleague);
  const [status, setStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [items, setItems] = useState<StorageItem[]>([]);
  const [isLoadingItems, setIsLoadingItems] = useState(true);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    pdfUrl: "",
    fileName: "",
  });

  const activeColleague = useMemo(
    () => colleagues.find((colleague) => colleague.id === selectedColleague),
    [selectedColleague],
  );

  const fetchItems = useCallback(async (colleagueId: string) => {
    setIsLoadingItems(true);
    setItemsError(null);
    try {
      const response = await fetch(`/api/storage?colleague=${colleagueId}`);
      const data = (await response.json()) as { items?: StorageItem[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Kon de documenten niet ophalen.");
      }
      setItems(data.items ?? []);
    } catch (error) {
      console.error(error);
      setItemsError(
        error instanceof Error
          ? error.message
          : "Er ging iets mis bij het ophalen van de documenten."
      );
    } finally {
      setIsLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    void fetchItems(selectedColleague);
  }, [fetchItems, selectedColleague]);

  function selectColleague(colleagueId: string, enabled: boolean) {
    if (!enabled) {
      setStatus(
        "Uploads voor deze collega zijn binnenkort beschikbaar. Kies voorlopig Remco.",
      );
      return;
    }
    setSelectedColleague(colleagueId);
    setStatus(null);
    setUploadedUrl(null);
    setItems([]);
    setItemsError(null);
    setIsLoadingItems(true);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setStatus("Kies eerst een PDF- of TXT-bestand.");
      return;
    }

    if (!activeColleague?.enabled) {
      setStatus("Uploads voor deze collega zijn nog niet geactiveerd.");
      return;
    }

    setIsUploading(true);
    setUploadedUrl(null);
    setStatus("Uploaden...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("colleagueId", selectedColleague);

      const response = await fetch("/api/storage/upload", {
        method: "POST",
        body: formData,
      });

      const data = (await response.json()) as UploadResponse;
      if (!response.ok) {
        throw new Error(data.error ?? "Upload mislukt.");
      }

      setStatus("Upload gelukt! Het document wordt verwerkt in de vector store.");
      setUploadedUrl(data.item?.blobUrl ?? null);
      setFile(null);

      void fetchItems(selectedColleague);
    } catch (error) {
      console.error(error);
      setStatus(
        error instanceof Error
          ? error.message
          : "Er ging iets mis tijdens het uploaden.",
      );
    } finally {
      setIsUploading(false);
    }
  }

  function handlePreview(blobUrl: string, fileName: string) {
    setPreviewModal({
      isOpen: true,
      pdfUrl: blobUrl,
      fileName,
    });
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setStatus(null);
    try {
      const response = await fetch(`/api/storage/${id}`, {
        method: "DELETE",
      });
      const data = (await response.json()) as { error?: string; warnings?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Kon het document niet verwijderen.");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (data.warnings) {
        setStatus(data.warnings);
      }
      void fetchItems(selectedColleague);
    } catch (error) {
      console.error(error);
      setStatus(
        error instanceof Error
          ? error.message
          : "Er ging iets mis tijdens het verwijderen.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7f0e4] px-4 py-12">
      <div className="w-full max-w-4xl rounded-[36px] border border-[#ecdcc4] bg-white shadow-[0_32px_80px_-40px_rgba(136,104,56,0.3)]">
        <div className="flex items-center justify-between border-b border-[#f0e3cf] px-8 py-6">
          <div>
            <h1 className="text-4xl font-semibold text-[#1f1a12]">
              PDF Upload naar Storage
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[#8a7b64]">
              Selecteer een PDF-bestand en kies vervolgens de collega om de data
              aan te leveren. Bestanden worden opgeslagen in de Vercel Blob map
              van de betreffende collega.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-[#e4d8c7] bg-[#fff8eb] px-4 py-2 text-sm font-semibold text-[#6b5b46] transition hover:border-[#dabb7b] hover:text-[#433b31]"
          >
            Terug naar Chat
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10 px-8 pb-12 pt-8">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-[#a3927a]">
              Collega&apos;s
            </p>
            <div className="grid gap-4 sm:grid-cols-3">
              {colleagues.map((colleague) => {
                const isActive = colleague.id === selectedColleague;
                const isEnabled = colleague.enabled;
                return (
                  <button
                    key={colleague.id}
                    type="button"
                    onClick={() => selectColleague(colleague.id, isEnabled)}
                    className={`relative flex items-center gap-4 rounded-3xl border px-4 py-4 text-left transition ${
                      isActive
                        ? "border-[#f3d89f] bg-[#fff5de] shadow-[0_10px_30px_-20px_rgba(157,117,47,0.5)]"
                        : "border-transparent bg-[#fbf6ef] hover:border-[#eedab5]"
                    } ${!isEnabled ? "cursor-not-allowed opacity-60" : ""}`}
                  >
                    <Image
                      src={colleague.avatar}
                      alt={colleague.name}
                      width={56}
                      height={56}
                      className={`h-14 w-14 rounded-full ${
                        colleague.id === "hnab"
                          ? "object-contain bg-white p-2"
                          : "object-cover"
                      }`}
                    />
                    <div>
                      <p className="font-semibold text-[#1f1a12]">
                        {colleague.name}
                      </p>
                      <p className="text-xs text-[#8a7b64]">
                        {colleague.title}
                      </p>
                      {!isEnabled ? (
                        <span className="mt-1 inline-block rounded-full bg-[#f4e7d2] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b6a58a]">
                          Binnenkort
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-[#b6a58a]">
              Kies eerst de collega voor wie je het document wilt klaarzetten.
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a3927a]">
              Selecteer PDF of TXY bestanden
            </span>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-[#dabb7b] bg-[#fff7e5] px-6 py-10 text-center text-sm text-[#6b5b46] shadow-inner transition hover:border-[#c58c1a] hover:bg-[#fff0cf]">
              <span className="rounded-full bg-white px-4 py-2 text-[#b17d1e] shadow">
                Bestanden kiezen
              </span>
              <span className="text-xs font-medium">
                {file ? file.name : "Geen bestand gekozen"}
              </span>
              <input
                type="file"
                accept="application/pdf,text/plain,.txt,text/markdown,.md,text/x-markdown"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="hidden"
              />
            </label>
            <p className="text-xs text-[#b6a58a]">{MAX_SIZE_TEXT}</p>
          </div>

          <div className="flex flex-col gap-4 rounded-3xl border border-[#e4d8c7] bg-[#fff7e5] px-6 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[#8a7b64]">
              Upload het bestand om het beschikbaar te maken in{" "}
              {activeColleague?.name ?? "de geselecteerde collega"}&apos;s documentmap.
            </p>
            <button
              type="submit"
              disabled={isUploading || !activeColleague?.enabled}
              className="flex h-12 items-center justify-center rounded-full bg-[#1f1a12] px-6 text-sm font-semibold text-white transition hover:bg-[#433b31] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? "Uploaden..." : "Uploaden ↗"}
            </button>
          </div>

          {status ? (
            <p className="text-sm font-medium text-[#8a7b64]">{status}</p>
          ) : null}

          {uploadedUrl ? (
            <div className="rounded-3xl border border-[#e4d8c7] bg-[#fff9ec] px-5 py-4 text-sm">
              <p className="font-semibold text-green-600">Upload geslaagd!</p>
              <p className="break-all text-xs text-[#8a7b64]">{uploadedUrl}</p>
            </div>
          ) : null}

          <section className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#a3927a]">
                Geüploade documenten
              </p>
              <button
                type="button"
                onClick={() => void fetchItems(selectedColleague)}
                className="inline-flex items-center gap-2 rounded-full border border-[#e4d8c7] bg-[#fff8eb] px-3 py-2 text-xs font-semibold text-[#6b5b46] transition hover:border-[#dabb7b] hover:text-[#433b31]"
              >
                Vernieuwen ↻
              </button>
            </div>

            {itemsError ? (
              <p className="rounded-2xl border border-[#f3c4c1] bg-[#fff1f0] px-4 py-3 text-sm font-medium text-[#a83b2d]">
                {itemsError}
              </p>
            ) : null}

            {isLoadingItems ? (
              <p className="text-sm text-[#8a7b64]">Documenten worden geladen…</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-[#8a7b64]">
                Er zijn nog geen documenten geüpload voor {activeColleague?.name}.
              </p>
            ) : (
              <ul className="space-y-3">
                {items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 rounded-3xl border border-[#e4d8c7] bg-[#fffdf7] px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#1f1a12]">
                        {item.fileName}
                      </p>
                      <p className="text-xs text-[#8a7b64]">
                        Geüpload op{" "}
                        {new Date(item.createdAt).toLocaleString("nl-NL", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                      <p className="text-xs text-[#b6a58a]">
                        Status: {item.status.toLowerCase()}
                      </p>
                      <button
                        type="button"
                        onClick={() => handlePreview(item.blobUrl, item.fileName)}
                        className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-[#b17d1e] hover:text-[#8c610a] transition"
                      >
                        📄 Bekijk PDF
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="inline-flex items-center gap-2 rounded-full border border-[#f0d9d4] bg-[#fff3ef] px-3 py-2 text-xs font-semibold text-[#a83b2d] transition hover:border-[#e5b5ab] hover:bg-[#ffe7df] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {deletingId === item.id ? "Bezig…" : "Verwijder"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </form>
      </div>

      <PdfPreviewModal
        isOpen={previewModal.isOpen}
        pdfUrl={previewModal.pdfUrl}
        fileName={previewModal.fileName}
        onClose={() => setPreviewModal({ isOpen: false, pdfUrl: "", fileName: "" })}
      />
    </main>
  );
}

