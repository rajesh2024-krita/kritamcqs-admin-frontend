import { chapterService } from "../api/chapterService";
import { subjectService } from "../api/subjectService";
import { topicService } from "../api/topicService";
import { EntityManagerPage } from "./common/EntityManagerPage";

function formatSubjectLabel(subject) {
  if (!subject) return "-";
  if (typeof subject === "string") return subject;
  return `${subject.name} (${subject.examType})`;
}

export function TopicsPage() {
  return (
    <EntityManagerPage
      title="Topics"
      description="Manage chapter-level topics used for practice and question tagging."
      service={topicService}
      lookupLoaders={[
        { key: "subjects", load: () => subjectService.list({ limit: 250 }) },
        { key: "chapters", load: () => chapterService.list({ limit: 500 }) },
      ]}
      fields={[
        {
          name: "subjectId",
          label: "Subject",
          required: true,
          type: "select",
          options: (_form, lookups) => (lookups.subjects || []).map((subject) => ({ label: formatSubjectLabel(subject), value: subject.id })),
        },
        {
          name: "chapterId",
          label: "Chapter",
          required: true,
          type: "select",
          options: (form, lookups) => (lookups.chapters || [])
            .filter((chapter) => !form.subjectId || chapter.subjectId?.id === form.subjectId || chapter.subjectId === form.subjectId)
            .map((chapter) => ({ label: chapter.name, value: chapter.id })),
        },
        { name: "name", label: "Topic Name", required: true },
      ]}
      columns={[
        { key: "name", label: "Topic" },
        { key: "subjectId", label: "Subject", render: (row) => formatSubjectLabel(row.subjectId) },
        { key: "chapterId", label: "Chapter", render: (row) => row.chapterId?.name || "-" },
      ]}
    />
  );
}
