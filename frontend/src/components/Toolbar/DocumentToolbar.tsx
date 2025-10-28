import React, { useMemo, useState } from 'react';
import ShareModal from '../Permissions/ShareModal';
import { DocumentPermissionsResponse } from '~/api/permissions';

type PermissionsMap = Record<string, DocumentPermissionsResponse>;

export interface DocumentToolbarProps {
  actorId: string;
  selectedDocumentIds: string[];
  permissionsByDocument: PermissionsMap;
}

const DocumentToolbar: React.FC<DocumentToolbarProps> = ({
  actorId,
  selectedDocumentIds,
  permissionsByDocument
}) => {
  const [openDocumentId, setOpenDocumentId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<PermissionsMap>(permissionsByDocument);

  const isBulk = selectedDocumentIds.length > 1;
  const firstDocumentId = useMemo(() => selectedDocumentIds[0] ?? null, [selectedDocumentIds]);

  const openShareModal = () => {
    if (!firstDocumentId) {
      return;
    }
    setOpenDocumentId(firstDocumentId);
  };

  const closeShareModal = () => setOpenDocumentId(null);

  const handlePermissionsUpdate = (updated: DocumentPermissionsResponse) => {
    setPermissions((current) => ({ ...current, [updated.documentId]: updated }));
  };

  const selectedPermissions = firstDocumentId
    ? permissions[firstDocumentId]
    : undefined;

  return (
    <div className="document-toolbar">
      <button type="button" onClick={openShareModal} disabled={!firstDocumentId}>
        Share
      </button>
      {openDocumentId && selectedPermissions && (
        <ShareModal
          actorId={actorId}
          documentId={openDocumentId}
          initialPermissions={selectedPermissions}
          isOpen={true}
          mode={isBulk ? 'bulk' : 'single'}
          onClose={closeShareModal}
          onPermissionsUpdate={handlePermissionsUpdate}
        />
      )}
    </div>
  );
};

export default DocumentToolbar;
