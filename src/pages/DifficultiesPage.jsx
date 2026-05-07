import { difficultyService } from "../api/difficultyService";
import { EntityManagerPage } from "./common/EntityManagerPage";

export function DifficultiesPage() {
  return (
    <EntityManagerPage
      title="Difficulties"
      description="Manage the shared difficulty levels used in admin and the student app."
      service={difficultyService}
      fields={[
        { name: "key", label: "Key", required: true },
        { name: "name", label: "Name", required: true },
        { name: "sortOrder", label: "Sort Order", type: "number", defaultValue: 0 },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
      columns={[
        { key: "key", label: "Key" },
        { key: "name", label: "Name" },
        { key: "sortOrder", label: "Sort Order" },
        { key: "description", label: "Description" },
      ]}
    />
  );
}
