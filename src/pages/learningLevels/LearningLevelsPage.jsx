import { learningLevelService } from "../../api/learningLevelService";
import { EntityManagerPage } from "../common/EntityManagerPage";
import { formatDate } from "../../utils/format";

export function LearningLevelsPage() {
  return (
    <EntityManagerPage
      title="Learning Levels"
      description="Manage learner levels used during onboarding and profile preferences."
      service={learningLevelService}
      fields={[
        { name: "key", label: "Key", required: true },
        { name: "label", label: "Label", required: true },
        { name: "description", label: "Description", type: "textarea", full: true },
        { name: "sortOrder", label: "Sort Order", type: "number" },
        { name: "active", label: "Active", type: "checkbox", defaultValue: true },
      ]}
      columns={[
        { key: "key", label: "Key" },
        { key: "label", label: "Label" },
        { key: "description", label: "Description" },
        { key: "sortOrder", label: "Sort" },
        { key: "active", label: "Status", render: (row) => (row.active ? "Active" : "Inactive") },
        { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
      ]}
    />
  );
}
