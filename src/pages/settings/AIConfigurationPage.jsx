import { useEffect, useMemo, useState } from "react";
import { aiConfigService } from "../../api/aiConfigService";
import { useToast } from "../../context/ToastContext";
import { cn, ui } from "../../ui";

const PROVIDERS = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "gemini", label: "Google Gemini" },
  { value: "openai", label: "OpenAI" },
  { value: "groq", label: "Groq" },
];

export function AIConfigurationPage() {
  const toast = useToast();
  const [configs, setConfigs] = useState([]);
  const [provider, setProvider] = useState("openrouter");
  const [form, setForm] = useState({ model: "", apiKey: "", baseUrl: "", organizationId: "" });
  const [models, setModels] = useState([]);
  const [busy, setBusy] = useState(false);

  const selectedConfig = useMemo(() => configs.find((item) => item.provider === provider), [configs, provider]);

  async function loadConfigs() {
    const response = await aiConfigService.list();
    setConfigs(response.data || []);
  }

  useEffect(() => {
    void loadConfigs();
  }, []);

  useEffect(() => {
    setForm({
      model: selectedConfig?.model || "",
      apiKey: "",
      baseUrl: selectedConfig?.baseUrl || "",
      organizationId: selectedConfig?.organizationId || "",
    });
    setModels(selectedConfig?.availableModels || []);
  }, [selectedConfig?.provider]);

  function update(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function save() {
    setBusy(true);
    try {
      const response = await aiConfigService.save({ provider, ...form, isActive: true });
      toast.success("AI configuration saved.");
      await loadConfigs();
      setModels(response.data?.availableModels || models);
    } catch (error) {
      toast.error(error?.response?.data?.message || "AI configuration save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function fetchModels() {
    setBusy(true);
    try {
      if (form.apiKey || form.baseUrl || form.organizationId || form.model) {
        await aiConfigService.save({ provider, ...form, isActive: true });
      }
      const response = await aiConfigService.fetchModels(provider);
      setModels(response.data?.models || []);
      toast.success(`${response.data?.models?.length || 0} models loaded.`);
      await loadConfigs();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Unable to fetch AI models.");
    } finally {
      setBusy(false);
    }
  }

  async function testConnection() {
    setBusy(true);
    try {
      if (form.apiKey || form.baseUrl || form.organizationId || form.model) {
        await aiConfigService.save({ provider, ...form, isActive: true });
      }
      const response = await aiConfigService.test(provider);
      setModels(response.data?.models || models);
      toast.success(response.data?.message || "AI connection succeeded.");
      await loadConfigs();
    } catch (error) {
      toast.error(error?.response?.data?.message || "AI connection failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl font-black text-slate-950">AI Configuration</h2>
        <p className={ui.muted}>Configure the provider and model used by AI-powered question audit and fixes.</p>
      </div>

      <div className={ui.panel}>
        <div className="grid gap-4 md:grid-cols-2">
          <label className={ui.field}>
            <span>Provider</span>
            <select className={ui.input} value={provider} onChange={(event) => setProvider(event.target.value)}>
              {PROVIDERS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <label className={ui.field}>
            <span>API Key</span>
            <input className={ui.input} type="password" value={form.apiKey} onChange={(event) => update("apiKey", event.target.value)} placeholder={selectedConfig?.hasApiKey ? "Saved key is configured" : "Enter API key"} />
          </label>
          <label className={ui.field}>
            <span>Base URL (optional)</span>
            <input className={ui.input} value={form.baseUrl} onChange={(event) => update("baseUrl", event.target.value)} placeholder="Use provider default" />
          </label>
          <label className={ui.field}>
            <span>Organization ID (optional)</span>
            <input className={ui.input} value={form.organizationId} onChange={(event) => update("organizationId", event.target.value)} />
          </label>
          <label className={cn(ui.field, "md:col-span-2")}>
            <span>Model</span>
            <select className={ui.input} value={form.model} onChange={(event) => update("model", event.target.value)}>
              <option value="">Select model</option>
              {models.map((model) => <option key={model} value={model}>{model}</option>)}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy} onClick={fetchModels} type="button">Fetch Models</button>
          <button className={cn(ui.buttonBase, ui.buttonSecondary)} disabled={busy} onClick={testConnection} type="button">Test Connection</button>
          <button className={cn(ui.buttonBase, ui.buttonPrimary)} disabled={busy} onClick={save} type="button">Save Configuration</button>
        </div>
      </div>

      <div className={ui.panel}>
        <strong>Saved Providers</strong>
        <div className={ui.tableScroll}>
          <table className={ui.table}>
            <thead><tr><th className={ui.tableHead}>Provider</th><th className={ui.tableHead}>Model</th><th className={ui.tableHead}>API Key</th><th className={ui.tableHead}>Status</th><th className={ui.tableHead}>Last Test</th></tr></thead>
            <tbody>
              {configs.map((item) => (
                <tr key={item.provider}>
                  <td className={ui.tableCell}>{PROVIDERS.find((entry) => entry.value === item.provider)?.label || item.provider}</td>
                  <td className={ui.tableCell}>{item.model || "-"}</td>
                  <td className={ui.tableCell}>{item.hasApiKey ? "Configured" : "Missing"}</td>
                  <td className={ui.tableCell}>{item.isActive ? "Active" : item.lastTestStatus || "untested"}</td>
                  <td className={ui.tableCell}>{item.lastTestMessage || "-"}</td>
                </tr>
              ))}
              {!configs.length ? <tr><td className={ui.tableCell} colSpan={5}>No AI provider configured yet.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
