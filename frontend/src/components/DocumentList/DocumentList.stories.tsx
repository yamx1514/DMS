import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
  DocumentList,
  DocumentSelectionProvider,
  DocumentListItem,
} from "./index";

const documents: DocumentListItem[] = [
  {
    id: "1",
    name: "Quarterly Report.pdf",
    updatedAt: "2023-08-01",
    size: 1024 * 1024 * 2,
    description: "Financial summary for Q2",
  },
  {
    id: "2",
    name: "Product Roadmap.docx",
    updatedAt: "2023-07-20",
    size: 1024 * 250,
    description: "Upcoming feature plan",
  },
];

const meta: Meta<typeof DocumentList> = {
  title: "Documents/DocumentList",
  component: DocumentList,
  decorators: [
    (Story) => (
      <DocumentSelectionProvider documentIds={documents.map((doc) => doc.id)}>
        <Story />
      </DocumentSelectionProvider>
    ),
  ],
  args: {
    documents,
  },
};

export default meta;

type Story = StoryObj<typeof DocumentList>;

export const Default: Story = {};

export const WithUploadProgress: Story = {
  args: {
    uploadProgress: [
      {
        id: "upload-1",
        name: "Design-spec.pdf",
        progress: 65,
        status: "uploading",
      },
    ],
  },
};
