import { useCallback, useEffect, useMemo, useState } from 'react';

import type { DocumentSummary, FolderSummary, Visibility } from './types';

export interface UseDocumentBrowserOptions {
  accountId?: string;
}

export interface UseDocumentBrowserResult {
  loading: boolean;
  error?: string;
  folders: FolderSummary[];
  documents: DocumentSummary[];
  selectedFolder?: FolderSummary;
  refresh: () => void;
  setFolder: (id?: string) => void;
}

const buildHeaders = (accountId?: string): HeadersInit => {
  const headers: HeadersInit = {
    Accept: 'application/json',
  };
  if (accountId) {
    headers['X-Account-Id'] = accountId;
  }
  return headers;
};

const sortByName = <T extends { name: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => a.name.localeCompare(b.name));

export const useDocumentBrowser = (
  options: UseDocumentBrowserOptions = {},
): UseDocumentBrowserResult => {
  const { accountId } = options;
  const [folders, setFolders] = useState<FolderSummary[]>([]);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const [folderResponse, documentResponse] = await Promise.all([
        fetch('/api/documents/folders', { headers: buildHeaders(accountId) }),
        fetch('/api/documents', { headers: buildHeaders(accountId) }),
      ]);

      if (!folderResponse.ok) {
        throw new Error(`Unable to load folders (${folderResponse.status})`);
      }
      if (!documentResponse.ok) {
        throw new Error(`Unable to load documents (${documentResponse.status})`);
      }

      const folderPayload: FolderSummary[] = await folderResponse.json();
      const documentPayload: DocumentSummary[] = await documentResponse.json();

      setFolders(sortByName(folderPayload));
      setDocuments(sortByName(documentPayload));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [accountId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(() => {
    void fetchData();
  }, [fetchData]);

  const setFolder = useCallback((id?: string) => {
    setSelectedFolderId(id);
  }, []);

  const selectedFolder = useMemo(
    () => folders.find((folder) => folder.id === selectedFolderId),
    [folders, selectedFolderId],
  );

  const visibleDocuments = useMemo(() => {
    if (!selectedFolderId) {
      return documents.filter((document) => !document.folder_id);
    }
    return documents.filter((document) => document.folder_id === selectedFolderId);
  }, [documents, selectedFolderId]);

  return {
    loading,
    error,
    folders,
    documents: visibleDocuments,
    selectedFolder,
    refresh,
    setFolder,
  };
};

export const visibilityLabel: Record<Visibility, string> = {
  public: 'Public',
  restricted: 'Restricted',
  account_specific: 'Account specific',
};
