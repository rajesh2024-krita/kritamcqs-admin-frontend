import { examTypeService } from "../../api/examTypeService";
import { questionTypeService } from "../../api/questionTypeService";
import { EntityManagerPage } from "../common/EntityManagerPage";

export function QuestionTypesPage() {
  return (
    <EntityManagerPage
      title="Question Types"
      description="Configure the supported question types for NEET and JEE."
      service={questionTypeService}
      mapItemToForm={(item, form) => ({
        ...form,
        name: item.name || "",
        examType: item.examType || item.examCategory || "",
        responseType: item.responseType || "single",
        displayVariant: item.displayVariant || "single_choice",
        description: item.description || "",
        exampleQuestion: item.exampleQuestion || "",
        exampleOptions: item.exampleOptions || "",
        exampleAnswer: item.exampleAnswer || "",
        exampleExplanation: item.exampleExplanation || "",
      })}
      lookupLoaders={[
        { key: "examTypes", load: () => examTypeService.list({ limit: 50 }) },
      ]}
      filters={[
        {
          name: "examType",
          label: "Exam Type",
          placeholder: "All Exam Types",
          options: (lookups) => (lookups.examTypes || []).map((item) => ({ label: item.name || item.label || item.key, value: item.name || item.key || item.label })),
        },
        {
          name: "responseType",
          label: "Response",
          placeholder: "All Response Types",
          options: [
            { label: "Single Correct", value: "single" },
            { label: "Multiple Correct", value: "multiple" },
            { label: "Numeric", value: "numeric" },
          ],
        },
        {
          name: "displayVariant",
          label: "Display",
          placeholder: "All Displays",
          options: [
            { label: "Single Choice", value: "single_choice" },
            { label: "Multiple Choice", value: "multiple_choice" },
            { label: "Numeric", value: "numeric" },
            { label: "Assertion-Reasoning", value: "assertion_reasoning" },
            { label: "Statement Set", value: "statement_set" },
            { label: "Matching", value: "matching" },
            { label: "Diagram", value: "diagram" },
          ],
        },
      ]}
      fields={[
        { name: "name", label: "Name", required: true },
        {
          name: "examType",
          label: "Exam Type",
          type: "select",
          required: true,
          options: (_form, lookups) => (lookups.examTypes || []).map((item) => ({ label: item.name || item.label || item.key, value: item.name || item.key || item.label })),
        },
        {
          name: "responseType",
          label: "Response Type",
          type: "select",
          options: [
            { label: "Single Correct", value: "single" },
            { label: "Multiple Correct", value: "multiple" },
            { label: "Numeric", value: "numeric" },
          ],
          defaultValue: "single",
        },
        {
          name: "displayVariant",
          label: "Frontend Display",
          type: "select",
          options: [
            { label: "Single Choice", value: "single_choice" },
            { label: "Multiple Choice", value: "multiple_choice" },
            { label: "Numeric", value: "numeric" },
            { label: "Assertion-Reasoning", value: "assertion_reasoning" },
            { label: "Statement Set", value: "statement_set" },
            { label: "Matching", value: "matching" },
            { label: "Diagram", value: "diagram" },
          ],
          defaultValue: "single_choice",
        },
        { name: "description", label: "Description", type: "textarea", full: true },
        { name: "exampleQuestion", label: "Example Question", type: "textarea", full: true },
        { name: "exampleOptions", label: "Example Options", type: "textarea", full: true },
        { name: "exampleAnswer", label: "Example Answer", full: true },
        { name: "exampleExplanation", label: "Example Explanation", type: "textarea", full: true },
      ]}
      columns={[
        { key: "name", label: "Name" },
        { key: "examType", label: "Exam Type" },
        { key: "responseType", label: "Response Type" },
        { key: "displayVariant", label: "Frontend Display" },
        {
          key: "exampleQuestion",
          label: "Example Preview",
          render: (row) => (
            <div className="max-w-[440px] whitespace-pre-wrap">
              <div className="font-semibold text-slate-900">{row.exampleQuestion || "-"}</div>
              {row.exampleOptions ? <div className="mt-1 text-xs text-slate-500">{row.exampleOptions}</div> : null}
            </div>
          ),
        },
      ]}
    />
  );
}
