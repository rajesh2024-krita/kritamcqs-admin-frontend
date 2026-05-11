import { examTypeService } from "../../api/examTypeService";
import { yearService } from "../../api/yearService";
import { EntityManagerPage } from "../common/EntityManagerPage";

export function YearsPage() {
  return (
    <EntityManagerPage
      title="Years"
      description="Manage year names under each exam type."
      service={yearService}
      lookupLoaders={[
        { key: "examTypes", load: () => examTypeService.list({ limit: 50 }) },
      ]}
      fields={[
        { name: "name", label: "Year", required: true },
        {
          name: "examType",
          label: "Exam Type",
          type: "select",
          options: (_form, lookups) => (lookups.examTypes || []).map((item) => ({ label: item.name || item.label || item.key, value: item.name || item.key || item.label })),
        },
      ]}
      columns={[
        { key: "name", label: "Year" },
        { key: "examType", label: "Exam Type" },
      ]}
    />
  );
}
