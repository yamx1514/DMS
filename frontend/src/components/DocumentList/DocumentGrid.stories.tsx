import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import {
  DocumentGrid,
  DocumentSelectionProvider,
  DocumentListItem,
} from "./index";

const documents: DocumentListItem[] = [
  {
    id: "1",
    name: "Marketing Assets",
    updatedAt: "2023-06-11",
    description: "Logos, banners, and branding",
  },
  {
    id: "2",
    name: "Engineering Diagrams",
    updatedAt: "2023-05-03",
    description: "System architecture references",
  },
  {
    id: "3",
    name: "Contracts",
    updatedAt: "2023-04-18",
    description: "Active agreements",
  },
];

const meta: Meta<typeof DocumentGrid> = {
  title: "Documents/DocumentGrid",
  component: DocumentGrid,
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

type Story = StoryObj<typeof DocumentGrid>;

export const Default: Story = {};

export const WithUploadProgress: Story = {
  args: {
    uploadProgress: [
      {
        id: "upload-2",
        name: "Wireframes.fig",
        progress: 40,
        status: "uploading",
      },
      {
        id: "upload-3",
        name: "Dataset.csv",
        progress: 100,
        status: "success",
      },
    ],
  },
};
