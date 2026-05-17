import { modeService } from "../../api/modeService";
import { EntityManagerPage } from "../common/EntityManagerPage";
import { formatDate } from "../../utils/format";

export function ModesPage() {
  return (
    <EntityManagerPage
      title="Modes"
      description="Manage exam modes used across the learning platform."
      service={modeService}
      sortable
      defaultQuery={{ sortBy: "sortOrder", sortOrder: "asc" }}
      fields={[
        { name: "key", label: "Key", required: true },
        { name: "label", label: "Label", required: true },
        { name: "sortOrder", label: "Sort Order", type: "number", defaultValue: 0 },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
      columns={[
        { key: "key", label: "Key" },
        { key: "label", label: "Label" },
        { key: "sortOrder", label: "Sort" },
        { key: "description", label: "Description" },
        { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
      ]}
    />
  );
}
