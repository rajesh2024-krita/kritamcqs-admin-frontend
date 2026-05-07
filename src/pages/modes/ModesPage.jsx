import { modeService } from "../../api/modeService";
import { EntityManagerPage } from "../common/EntityManagerPage";
import { formatDate } from "../../utils/format";

export function ModesPage() {
  return (
    <EntityManagerPage
      title="Modes"
      description="Manage exam modes used across the learning platform."
      service={modeService}
      fields={[
        { name: "key", label: "Key", required: true, type: "select", options: [{ label: "NEET", value: "NEET" }, { label: "JEE", value: "JEE" }, { label: "BOTH", value: "BOTH" }] },
        { name: "label", label: "Label", required: true },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
      columns={[
        { key: "key", label: "Key" },
        { key: "label", label: "Label" },
        { key: "description", label: "Description" },
        { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
      ]}
    />
  );
}
