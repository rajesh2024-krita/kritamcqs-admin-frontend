export const ctaTypeOptions = [
  { value: "none", label: "None", url: "" },
  { value: "custom_url", label: "Custom URL", url: "" },
  { value: "home", label: "Home", url: "https://app.kritamcqs.com" },
  { value: "login", label: "Login", url: "https://app.kritamcqs.com/login" },
  { value: "register", label: "Register", url: "https://app.kritamcqs.com/register" },
  { value: "subscription", label: "Subscription", url: "https://app.kritamcqs.com/subscription" },
  { value: "premium_plan", label: "Premium Plan", url: "https://app.kritamcqs.com/subscription" },
  { value: "renew_subscription", label: "Renew Subscription", url: "https://app.kritamcqs.com/subscription/renew" },
  { value: "upgrade_plan", label: "Upgrade Plan", url: "https://app.kritamcqs.com/subscription/upgrade" },
  { value: "payment", label: "Payment", url: "https://app.kritamcqs.com/payment" },
  { value: "daily_test", label: "Daily Test", url: "https://app.kritamcqs.com/daily-test" },
  { value: "mock_test", label: "Mock Test", url: "https://app.kritamcqs.com/mock-test" },
  { value: "revision", label: "Revision", url: "https://app.kritamcqs.com/revision" },
  { value: "pyq", label: "PYQ", url: "https://app.kritamcqs.com/pyq" },
  { value: "leaderboard", label: "Leaderboard", url: "https://app.kritamcqs.com/leaderboard" },
  { value: "weak_areas", label: "Weak Areas", url: "https://app.kritamcqs.com/weak-areas" },
  { value: "mistake_book", label: "Mistake Book", url: "https://app.kritamcqs.com/mistake-book" },
  { value: "analytics", label: "Analytics", url: "https://app.kritamcqs.com/analytics" },
  { value: "profile", label: "Profile", url: "https://app.kritamcqs.com/profile" },
  { value: "notifications", label: "Notifications", url: "https://app.kritamcqs.com/notifications" },
  { value: "offers", label: "Offers", url: "https://app.kritamcqs.com/offers" },
  { value: "referral", label: "Referral", url: "https://app.kritamcqs.com/referral?code={{referral_code}}" },
  { value: "invite_friends", label: "Invite Friends", url: "https://app.kritamcqs.com/invite" },
  { value: "contact_support", label: "Contact Support", url: "https://app.kritamcqs.com/support" },
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
