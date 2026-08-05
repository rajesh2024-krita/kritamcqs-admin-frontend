export const ctaTypeOptions = [
  { value: "none", label: "None", url: "" },
  { value: "home", label: "Home", url: "/home" },
  { value: "daily_test", label: "Daily Test", url: "/daily-test" },
  { value: "revision", label: "Revision", url: "/revision" },
  { value: "mock_test", label: "Mock Test", url: "/mock-tests" },
  { value: "leaderboard", label: "Leaderboard", url: "/leaderboard" },
  { value: "weak_areas", label: "Weak Areas", url: "/weak-areas" },
  { value: "mistake_book", label: "Mistake Book", url: "/mistake-book" },
  { value: "subscription", label: "Subscription", url: "/subscription" },
  { value: "profile", label: "Profile", url: "/profile" },
  { value: "custom_url", label: "Custom URL", url: "" },
];

export const openInOptions = [
  { value: "app", label: "App" },
  { value: "website", label: "Website" },
  { value: "auto", label: "Auto (App if installed, otherwise Website)" },
];

export const alignmentOptions = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
];

export function getCtaTypeLabel(type) {
  return ctaTypeOptions.find((option) => option.value === type)?.label || type || "None";
}

export function isValidCtaUrl(value) {
  const url = String(value || "").trim();
  if (!url || /\s/.test(url)) return false;
  if (/^\/[^\s]*$/.test(url)) return true;
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      return Boolean(parsed.hostname);
    } catch {
      return false;
    }
  }
  return /^[a-z][a-z0-9+.-]*:\/\/\S+$/i.test(url);
}

export function ctaFieldsFromConfig(config) {
  if (!config) return {};
  return {
    ctaConfigId: config.id || config._id || "",
    ctaEnabled: true,
    ctaText: config.ctaText || "",
    ctaType: config.ctaType || "none",
    ctaUrl: config.ctaUrl || "",
    openIn: config.openIn || "auto",
    buttonColor: config.buttonColor || "#2563eb",
    buttonTextColor: config.buttonTextColor || "#ffffff",
    buttonAlignment: config.buttonAlignment || "center",
  };
}
