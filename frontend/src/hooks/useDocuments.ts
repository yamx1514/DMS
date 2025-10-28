import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";

export interface DocumentRecord {
  id: string;
  title: string;
  team: string;
  requiredRoles: string[];
}

interface UseDocumentsResult {
  documents: DocumentRecord[];
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

const buildHeaderValue = (values: string[]): string => values.filter(Boolean).join(",");

const getBaseUrl = () => process.env.REACT_APP_API_BASE_URL ?? "";

export const useDocuments = (): UseDocumentsResult => {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const endpoint = useMemo(() => `${getBaseUrl()}/documents`, []);

  const fetchDocuments = useCallback(async () => {
    if (!user) {
      setDocuments([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        headers: {
          "X-User-Id": user.id,
          "X-User-Roles": buildHeaderValue(user.roles),
          "X-User-Assignments": buildHeaderValue(user.assignments),
          "X-Delegated-Teams": buildHeaderValue(user.delegatedTeams),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch documents (status ${response.status})`);
      }

      const payload: DocumentRecord[] = await response.json();
      setDocuments(payload);
    } catch (err) {
      setError(err as Error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint, user]);

  useEffect(() => {
    void fetchDocuments();
  }, [fetchDocuments]);

  return { documents, loading, error, refetch: fetchDocuments };
};

export default useDocuments;
