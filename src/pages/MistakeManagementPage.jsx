import { useEffect, useState } from "react";
import { insightsService } from "../api/insightsService";
import { LoadingSpinner } from "../components/common/LoadingSpinner";
import { EmptyState } from "../components/common/EmptyState";
import { MathText } from "../components/common/MathText";
import { useToast } from "../context/ToastContext";
import { ui } from "../ui";

export function MistakeManagementPage() {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        setData(await insightsService.getMistakes());
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading && !data) return <LoadingSpinner label="Loading mistake management..." />;

  const summary = data?.summary || {};

  return (
    <div className="flex flex-col gap-6">
      <section className={ui.panel}>
        <div className={ui.eyebrow}>Mistake Intelligence</div>
        <h1 className="mb-1 text-3xl font-black tracking-tight text-slate-900">Mistake Management</h1>
        <p className={ui.muted}>Track frequently incorrect questions, user mistakes, topic reports, difficulty analysis, and repeated mistakes.</p>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {[
          ["Active Mistakes", summary.activeMistakes || 0],
          ["Repeated Mistakes", summary.repeatedMistakes || 0],
          ["Weak Mistakes", summary.weakMistakes || 0],
          ["Tracked Questions", summary.trackedQuestions || 0],
        ].map(([label, value]) => (
          <div key={label} className={ui.metricCard}>
            <div className={ui.metricLabel}>{label}</div>
            <div className={ui.metricValue}>{value}</div>
          </div>
        ))}
      </section>

      <section className={ui.panel}>
        <h2 className="mb-4 text-xl font-black text-slate-900">Frequently Incorrect Questions</h2>
        {data?.frequentIncorrectQuestions?.length ? (
          <div className={ui.tableWrap}>
            <div className={ui.tableScroll}>
              <table className={ui.table}>
                <thead>
                  <tr>{["Question", "Subject", "Chapter", "Difficulty", "Attempts", "Wrong", "Wrong %"].map((head) => <th key={head} className={ui.tableHead}>{head}</th>)}</tr>
                </thead>
                <tbody>
                  {data.frequentIncorrectQuestions.map((row) => (
                    <tr key={row.questionId}>
                      <td className={ui.tableCell}><MathText className="max-w-xl line-clamp-2">{row.question}</MathText></td>
                      <td className={ui.tableCell}>{row.subjectName}</td>
                      <td className={ui.tableCell}>{row.chapterName}</td>
                      <td className={ui.tableCell}>{row.difficulty}</td>
                      <td className={ui.tableCell}>{row.attempts}</td>
                      <td className={ui.tableCell}>{row.wrong}</td>
                      <td className={ui.tableCell}>{row.wrongRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : <EmptyState title="No mistake data" description="Incorrect question analytics will appear after submissions." />}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className={ui.panel}>
          <h2 className="mb-4 text-xl font-black text-slate-900">Topic-wise Mistake Reports</h2>
          <div className="space-y-3">
            {(data?.topicReports || []).map((item) => (
              <div key={item.chapterId} className={ui.activityItem}>
                <div className={ui.activityBody}>
                  <div className="font-bold text-slate-900">{item.chapterName}</div>
                  <div className="text-sm text-slate-500">{item.subjectName}</div>
                </div>
                <div className={ui.activityTime}>{item.wrong} wrong / {item.attempts} attempts<br />{item.wrongRate}% wrong</div>
              </div>
            ))}
          </div>
        </div>

        <div className={ui.panel}>
          <h2 className="mb-4 text-xl font-black text-slate-900">Difficulty-level Analysis</h2>
          <div className="space-y-3">
            {(data?.difficultyReports || []).map((item) => (
              <div key={item.difficulty} className={ui.activityItem}>
                <div className={ui.activityBody}>
                  <div className="font-bold text-slate-900">{item.difficulty}</div>
                  <div className="text-sm text-slate-500">{item.questions} flagged questions</div>
                </div>
                <div className={ui.activityTime}>{item.wrongRate}% wrong rate</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={ui.panel}>
        <h2 className="mb-4 text-xl font-black text-slate-900">User Mistake Analytics</h2>
        <div className={ui.tableWrap}>
          <div className={ui.tableScroll}>
            <table className={ui.table}>
              <thead>
                <tr>{["User", "Plan", "Chapter", "Attempts", "Accuracy", "Status", "Correction"].map((head) => <th key={head} className={ui.tableHead}>{head}</th>)}</tr>
              </thead>
              <tbody>
                {(data?.userMistakeAnalytics || []).map((row) => (
                  <tr key={row.id}>
                    <td className={ui.tableCell}>{row.userName}</td>
                    <td className={ui.tableCell}>{row.isPremium ? "Premium" : "Free"}</td>
                    <td className={ui.tableCell}>{row.chapterName}</td>
                    <td className={ui.tableCell}>{row.attempts}</td>
                    <td className={ui.tableCell}>{row.accuracy}%</td>
                    <td className={ui.tableCell}>{row.status}</td>
                    <td className={ui.tableCell}>Review question, explanation, and answer key in Question Management.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
