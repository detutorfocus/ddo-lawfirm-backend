// src/hooks/index.ts
// ── Shared React hooks — all client-safe, no @prisma/client imports

import { useState, useCallback, useEffect as useEffectDebounce, useState as useStateDebounce } from "react";
import { trpc } from "@/lib/trpc";

// ── DOCUMENT UPLOAD HOOK
// Uses plain string for documentType (matches Prisma DocumentType values)
interface UseUploadOptions {
  caseId?: string;
  clientId?: string;
  onSuccess?: (documentId: string) => void;
  onError?: (error: string) => void;
}

// NEW: optional per-call extras — lets callers pass a specific
// recipientId (lawyer/admin userId) and a description/note without
// changing the hook's constructor options, since these vary per upload
// rather than being fixed for the whole hook instance.
interface UploadExtras {
  recipientId?: string;
  description?: string;
  clientId?: string;
  isConfidential?: boolean;
}

export interface UploadState {
  file: File | null;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  documentId?: string;
  error?: string;
}

export function useUpload(options: UseUploadOptions = {}) {
  const [state, setState] = useState<UploadState>({
    file: null, progress: 0, status: "idle",
  });

  const getUploadUrl  = trpc.document.getUploadUrl.useMutation();
  const confirmUpload = trpc.document.confirmUpload.useMutation();

  const upload = useCallback(
    async (file: File, title: string, documentType: string = "OTHER", extras: UploadExtras = {}) => {
      setState({ file, progress: 0, status: "uploading" });
      try {
        const { presignedUrl, documentId } = await getUploadUrl.mutateAsync({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size,
          documentType: documentType as any,
          title,
          description: extras.description,
          caseId: options.caseId,
          clientId: extras.clientId ?? options.clientId,
          recipientId: extras.recipientId,
          isConfidential: extras.isConfidential ?? false,
        });

        const xhr = new XMLHttpRequest();
        await new Promise<void>((resolve, reject) => {
          xhr.upload.addEventListener("progress", (e) => {
            if (e.lengthComputable) {
              setState((prev) => ({ ...prev, progress: Math.round((e.loaded / e.total) * 100) }));
            }
          });
          xhr.addEventListener("load", () => xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
          xhr.addEventListener("error", () => reject(new Error("Network error")));
          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });

        await confirmUpload.mutateAsync({ documentId });
        setState({ file, progress: 100, status: "success", documentId });
        options.onSuccess?.(documentId);
        return documentId;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Upload failed";
        setState({ file, progress: 0, status: "error", error: message });
        options.onError?.(message);
        throw err;
      }
    },
    [getUploadUrl, confirmUpload, options]
  );

  const reset = useCallback(() => setState({ file: null, progress: 0, status: "idle" }), []);

  return { ...state, upload, reset, isUploading: state.status === "uploading" };
}

// ── NOTIFICATIONS HOOK
export function useNotifications() {
  const utils = trpc.useContext();
  const { data, isLoading } = trpc.notification.list.useQuery(
    { unreadOnly: false, limit: 20 },
    { refetchInterval: 30000 }
  );
  const markRead    = trpc.notification.markRead.useMutation({ onSuccess: () => utils.notification.list.invalidate() });
  const markAllRead = trpc.notification.markAllRead.useMutation({ onSuccess: () => utils.notification.list.invalidate() });

  return {
    notifications: data?.notifications ?? [],
    unreadCount:   data?.unreadCount ?? 0,
    isLoading,
    markRead:    (id: string) => markRead.mutate({ id }),
    markAllRead: () => markAllRead.mutate(),
  };
}

// ── PAGINATION HOOK
export function usePagination(initialPage = 1, initialPageSize = 20) {
  const [page, setPage]         = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const goToPage  = useCallback((p: number) => setPage(p), []);
  const nextPage  = useCallback(() => setPage((p) => p + 1), []);
  const prevPage  = useCallback(() => setPage((p) => Math.max(1, p - 1)), []);
  const reset     = useCallback(() => setPage(1), []);
  return { page, pageSize, setPage: goToPage, nextPage, prevPage, setPageSize, reset };
}

// ── DEBOUNCE HOOK
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useStateDebounce<T>(value);
  useEffectDebounce(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

// ── LOCAL STORAGE HOOK (client-only)
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.error(`useLocalStorage error for key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue] as const;
}
