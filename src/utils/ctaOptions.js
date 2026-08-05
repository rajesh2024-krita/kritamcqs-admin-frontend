export const ctaTypeOptions = [
  { value: "none", label: "None", url: "" },
  { value: "custom_url", label: "Custom URL", url: "" },
  { value: "home", label: "Home", url: "/dashboard" },
  { value: "login", label: "Login", url: "/login" },
  { value: "register", label: "Register", url: "/login" },
  { value: "subscription", label: "Subscription", url: "/subscription" },
  { value: "premium_plan", label: "Premium Plan", url: "/subscription" },
  { value: "renew_subscription", label: "Renew Subscription", url: "/subscription" },
  { value: "upgrade_plan", label: "Upgrade Plan", url: "/subscription" },
  { value: "payment", label: "Payment", url: "/subscription" },
  { value: "daily_test", label: "Daily Test", url: "/daily-test" },
  { value: "mock_test", label: "Mock Test", url: "/mock-tests" },
  { value: "revision", label: "Revision", url: "/revision" },
  { value: "pyq", label: "PYQ", url: "/year-questions" },
  { value: "leaderboard", label: "Leaderboard", url: "/dashboard" },
  { value: "weak_areas", label: "Weak Areas", url: "/weak-areas" },
  { value: "mistake_book", label: "Mistake Book", url: "/mistakes" },
  { value: "analytics", label: "Analytics", url: "/test-results" },
  { value: "profile", label: "Profile", url: "/profile" },
  { value: "notifications", label: "Notifications", url: "/notifications" },
  { value: "offers", label: "Offers", url: "/notifications" },
  { value: "referral", label: "Referral", url: "/profile?ref={{referral_code}}" },
  { value: "invite_friends", label: "Invite Friends", url: "/profile" },
  { value: "contact_support", label: "Contact Support", url: "/help-support" },
  { value: "faq", label: "FAQ", url: "https://kritamcqs.com/faq" },
  { value: "privacy_policy", label: "Privacy Policy", url: "https://kritamcqs.com/privacy-policy" },
  { value: "terms_conditions", label: "Terms & Conditions", url: "https://kritamcqs.com/terms-conditions" },
  { value: "website", label: "Website", url: "https://kritamcqs.com" },
  { value: "play_store", label: "Play Store", url: "https://play.google.com/store/apps/details?id=com.kritamcqs.app" },
  { value: "app_store", label: "App Store", url: "https://apps.apple.com/app/krita-mcqs" },
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
