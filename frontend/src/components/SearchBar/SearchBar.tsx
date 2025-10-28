import React, { useCallback, useEffect, useMemo, useState } from "react";
import styles from "./SearchBar.module.css";

type SearchFilters = {
  query?: string;
  tags: string[];
  category?: string;
  client?: string;
  visibility?: "private" | "internal" | "public" | "";
};

type TagSuggestion = {
  name: string;
  slug: string;
};

type DocumentResult = {
  id: string;
  title: string;
  category: string;
  client?: string | null;
  visibility: string;
  tags: string[];
};

type SearchBarProps = {
  actorId: string;
  onResults?: (documents: DocumentResult[]) => void;
};

const visibilityOptions: Array<SearchFilters["visibility"]> = [
  "",
  "private",
  "internal",
  "public",
];

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase();
}

export const SearchBar: React.FC<SearchBarProps> = ({ actorId, onResults }) => {
  const [filters, setFilters] = useState<SearchFilters>({ tags: [] });
  const [tagSuggestions, setTagSuggestions] = useState<TagSuggestion[]>([]);
  const [suggestedTags, setSuggestedTags] = useState<TagSuggestion[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTags() {
      try {
        const response = await fetch(`/documents/tags`);
        if (!response.ok) {
          throw new Error(`Failed to load tags (${response.status})`);
        }
        const data: TagSuggestion[] = await response.json();
        setTagSuggestions(data);
      } catch (err) {
        console.error(err);
      }
    }
    loadTags();
  }, []);

  const updateSuggestedTags = useCallback(
    (input: string) => {
      if (!input) {
        setSuggestedTags([]);
        return;
      }
      const normalized = normalizeTag(input);
      const matching = tagSuggestions
        .filter((tag) => tag.slug.includes(normalized))
        .slice(0, 5);
      setSuggestedTags(matching);
    },
    [tagSuggestions]
  );

  const onQueryChange: React.ChangeEventHandler<HTMLInputElement> = (event) => {
    const value = event.target.value;
    setFilters((prev) => ({ ...prev, query: value }));
    updateSuggestedTags(value);
  };

  const addTag = useCallback(
    (tag: string) => {
      const normalized = normalizeTag(tag);
      if (!normalized) {
        return;
      }
      setFilters((prev) => {
        if (prev.tags.includes(normalized)) {
          return prev;
        }
        return { ...prev, tags: [...prev.tags, normalized] };
      });
      setSuggestedTags([]);
    },
    []
  );

  const removeTag = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }, []);

  const executeSearch = useCallback(async () => {
    setPending(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("actor_id", actorId);
      if (filters.category) params.set("category", filters.category);
      if (filters.client) params.set("client", filters.client);
      if (filters.visibility) params.set("visibility", filters.visibility);
      const normalizedQuery = normalizeTag(filters.query ?? "");
      const allTags = new Set(filters.tags);
      if (normalizedQuery) {
        allTags.add(normalizedQuery);
      }
      allTags.forEach((tag) => params.append("tags", tag));

      const response = await fetch(`/documents/search?${params.toString()}`);
      if (!response.ok) {
        throw new Error(`Search failed (${response.status})`);
      }
      const results: DocumentResult[] = await response.json();
      onResults?.(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }, [actorId, filters, onResults]);

  const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    executeSearch();
  };

  const canSubmit = useMemo(() => !pending, [pending]);

  return (
    <form className={styles.container} onSubmit={onSubmit} role="search">
      <label className={styles.field}>
        <span className={styles.label}>Search documents</span>
        <input
          type="search"
          value={filters.query ?? ""}
          placeholder="Search by tag"
          onChange={onQueryChange}
          onBlur={() => updateSuggestedTags("")}
        />
      </label>

      {suggestedTags.length > 0 && (
        <ul className={styles.suggestions} role="listbox">
          {suggestedTags.map((tag) => (
            <li key={tag.slug}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addTag(tag.slug)}
              >
                {tag.name}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className={styles.selectedTags}>
        {filters.tags.map((tag) => (
          <span key={tag} className={styles.tagChip}>
            {tag}
            <button type="button" onClick={() => removeTag(tag)}>
              ×
            </button>
          </span>
        ))}
      </div>

      <div className={styles.filtersRow}>
        <label className={styles.field}>
          <span className={styles.label}>Category</span>
          <input
            value={filters.category ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, category: event.target.value }))
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Client</span>
          <input
            value={filters.client ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({ ...prev, client: event.target.value }))
            }
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Visibility</span>
          <select
            value={filters.visibility ?? ""}
            onChange={(event) =>
              setFilters((prev) => ({
                ...prev,
                visibility: event.target.value as SearchFilters["visibility"],
              }))
            }
          >
            {visibilityOptions.map((option) => (
              <option key={option || "any"} value={option}>
                {option ? option : "Any"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className={styles.actions}>
        <button type="submit" disabled={!canSubmit}>
          {pending ? "Searching…" : "Search"}
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    </form>
  );
};

export default SearchBar;
