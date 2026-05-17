import { examTypeService } from "../../api/examTypeService";
import { EntityManagerPage } from "../common/EntityManagerPage";
import { formatDate } from "../../utils/format";

export function ExamTypesPage() {
  return (
    <EntityManagerPage
      title="Exam Types"
      description="Manage the shared exam type master used by subjects, years, question types, and questions."
      service={examTypeService}
      sortable
      defaultQuery={{ sortBy: "sortOrder", sortOrder: "asc" }}
      fields={[
        { name: "name", label: "Name", required: true },
        { name: "sortOrder", label: "Sort Order", type: "number", defaultValue: 0 },
        { name: "description", label: "Description", type: "textarea", full: true },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "sortOrder", label: "Sort" },
        { key: "description", label: "Description" },
        { key: "createdAt", label: "Created", render: (row) => formatDate(row.createdAt) },
      ]}
    />
  );
}
