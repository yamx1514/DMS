import React, { useState } from 'react';
import ShareModal from '../Permissions/ShareModal';
import { DocumentPermissionsResponse } from '~/api/permissions';

export interface DocumentItemMenuProps {
  actorId: string;
  documentId: string;
  permissions: DocumentPermissionsResponse;
}

const DocumentItemMenu: React.FC<DocumentItemMenuProps> = ({ actorId, documentId, permissions }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [documentPermissions, setDocumentPermissions] = useState<DocumentPermissionsResponse>(permissions);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  const handlePermissionsUpdate = (updated: DocumentPermissionsResponse) => {
    setDocumentPermissions(updated);
  };

  return (
    <div className="document-item-menu">
      <button type="button" onClick={openModal}>
        Share
      </button>
      {isModalOpen && (
        <ShareModal
          actorId={actorId}
          documentId={documentId}
          initialPermissions={documentPermissions}
          isOpen={isModalOpen}
          onClose={closeModal}
          onPermissionsUpdate={handlePermissionsUpdate}
        />
      )}
    </div>
  );
};

export default DocumentItemMenu;
