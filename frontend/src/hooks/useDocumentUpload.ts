import { useCallback, useMemo, useRef, useState } from "react";
import { UploadProgressItem } from "../components/DocumentList/DocumentList";

type UploadHandler = (
  file: File,
  onProgress: (progress: number) => void
) => Promise<void> | void;

type UploadRecord = UploadProgressItem & {
  startedAt: number;
};

const createUploadId = (file: File, index: number) =>
  `${file.name}-${file.size}-${index}-${Date.now()}`;

export const useDocumentUpload = (handler?: UploadHandler) => {
  const [uploads, setUploads] = useState<Record<string, UploadRecord>>({});
  const handlerRef = useRef<UploadHandler | undefined>(handler);
  handlerRef.current = handler;

  const updateUpload = useCallback(
    (id: string, update: Partial<UploadRecord>) => {
      setUploads((prev) => {
        const existing = prev[id];
        if (!existing) {
          return prev;
        }
        return {
          ...prev,
          [id]: { ...existing, ...update },
        };
      });
    },
    []
  );

  const finishUpload = useCallback(
    (id: string, status: UploadProgressItem["status"], error?: string) => {
      updateUpload(id, {
        status,
        errorMessage: error,
        progress: status === "success" ? 100 : 0,
      });
    },
    [updateUpload]
  );

  const uploadFiles = useCallback(
    async (files: File[]) => {
      const activeHandler = handlerRef.current;
      files.forEach((file, index) => {
        const id = createUploadId(file, index);
        setUploads((prev) => ({
          ...prev,
          [id]: {
            id,
            name: file.name,
            progress: 0,
            status: "uploading",
            startedAt: Date.now(),
          },
        }));

        const onProgress = (progress: number) => {
          updateUpload(id, { progress });
        };

        const processUpload = async () => {
          try {
            if (activeHandler) {
              await activeHandler(file, onProgress);
              finishUpload(id, "success");
            } else {
              // Simulate progress when no handler is provided.
              for (let step = 10; step <= 100; step += 10) {
                await new Promise((resolve) => setTimeout(resolve, 50));
                onProgress(step);
              }
              finishUpload(id, "success");
            }
          } catch (error) {
            finishUpload(
              id,
              "error",
              error instanceof Error ? error.message : "Upload failed"
            );
          }
        };

        void processUpload();
      });
    },
    [finishUpload, updateUpload]
  );

  const resetUpload = useCallback((id: string) => {
    setUploads((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const uploadProgress = useMemo<UploadProgressItem[]>(() => {
    return Object.values(uploads).map(({ startedAt: _startedAt, ...rest }) => rest);
  }, [uploads]);

  return {
    uploadFiles,
    uploadProgress,
    resetUpload,
  };
};

export type UseDocumentUploadReturn = ReturnType<typeof useDocumentUpload>;
