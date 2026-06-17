"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { clearDirectoryHandle, loadDirectoryHandle, saveDirectoryHandle } from "@/lib/idb";
import { ensureSubdirectories, isFileSystemAccessSupported } from "@/lib/fsLessons";

export type DirectoryStatus =
  | "checking"
  | "unsupported"
  | "disconnected"
  | "needs-permission"
  | "connected";

interface DirectoryContextValue {
  status: DirectoryStatus;
  directoryHandle: FileSystemDirectoryHandle | null;
  directoryName: string | null;
  error: string | null;
  pickDirectory: () => Promise<void>;
  reconnect: () => Promise<void>;
  forgetDirectory: () => Promise<void>;
}

const DirectoryContext = createContext<DirectoryContextValue | null>(null);

export function DirectoryProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<DirectoryStatus>("checking");
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!isFileSystemAccessSupported()) {
        setStatus("unsupported");
        return;
      }
      const handle = await loadDirectoryHandle().catch(() => null);
      if (!handle) {
        setStatus("disconnected");
        return;
      }
      const permission = await handle.queryPermission({ mode: "readwrite" }).catch(
        () => "denied" as PermissionState,
      );
      if (permission === "granted") {
        setDirectoryHandle(handle);
        setStatus("connected");
      } else {
        setDirectoryHandle(handle);
        setStatus("needs-permission");
      }
    })();
  }, []);

  const pickDirectory = useCallback(async () => {
    setError(null);
    try {
      const handle = await window.showDirectoryPicker({ mode: "readwrite" });
      await ensureSubdirectories(handle);
      await saveDirectoryHandle(handle);
      setDirectoryHandle(handle);
      setStatus("connected");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "폴더를 선택하지 못했습니다.");
    }
  }, []);

  const reconnect = useCallback(async () => {
    if (!directoryHandle) return;
    setError(null);
    try {
      const permission = await directoryHandle.requestPermission({ mode: "readwrite" });
      if (permission === "granted") {
        await ensureSubdirectories(directoryHandle);
        setStatus("connected");
      } else {
        setError("폴더 접근 권한이 거부되었습니다.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "권한 확인에 실패했습니다.");
    }
  }, [directoryHandle]);

  const forgetDirectory = useCallback(async () => {
    await clearDirectoryHandle();
    setDirectoryHandle(null);
    setStatus("disconnected");
  }, []);

  return (
    <DirectoryContext.Provider
      value={{
        status,
        directoryHandle,
        directoryName: directoryHandle?.name ?? null,
        error,
        pickDirectory,
        reconnect,
        forgetDirectory,
      }}
    >
      {children}
    </DirectoryContext.Provider>
  );
}

export function useDirectory(): DirectoryContextValue {
  const ctx = useContext(DirectoryContext);
  if (!ctx) throw new Error("useDirectory must be used within DirectoryProvider");
  return ctx;
}
