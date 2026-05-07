import { examTypeService } from "../../api/examTypeService";
import { subjectService } from "../../api/subjectService";
import { EntityManagerPage } from "../common/EntityManagerPage";

export function SubjectsPage() {
  return (
    <EntityManagerPage
      title="Subjects"
      description="Manage exam-specific subjects so NEET and JEE questions stay separated correctly."
      service={subjectService}
      lookupLoaders={[
        { key: "examTypes", load: () => examTypeService.list({ limit: 50 }) },
      ]}
      fields={[
        {
          name: "examType",
          label: "Exam Type",
          required: true,
          type: "select",
          options: (_form, lookups) => (lookups.examTypes || []).map((item) => ({ label: item.name || item.label || item.key, value: item.name || item.key || item.label })),
        },
        { name: "name", label: "Subject", required: true },
        { name: "icon", label: "Icon" },
        { name: "color", label: "Color" },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "examType", label: "Exam Type" },
        { key: "icon", label: "Icon" },
        { key: "color", label: "Color" },
      ]}
    />
  );
}
