import React from "react";
import useDocuments from "../hooks/useDocuments";

const DocumentsPage: React.FC = () => {
  const { documents, loading, error } = useDocuments();

  if (loading) {
    return <div>Loading documents…</div>;
  }

  if (error) {
    return <div role="alert">Failed to load documents: {error.message}</div>;
  }

  return (
    <div>
      <h1>Documents</h1>
      <ul>
        {documents.map((document) => (
          <li key={document.id}>
            <strong>{document.title}</strong> — Team: {document.team}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentsPage;
