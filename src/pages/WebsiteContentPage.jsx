import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Eye, EyeOff, Image, Plus, RefreshCw, Save, Trash2, Upload } from "lucide-react";
import { uploadService } from "../api/uploadService";
import { websiteContentService } from "../api/websiteContentService";
import { cn, ui } from "../ui";

const defaultInstagramTabs = [
  { id: "student-reviews", name: "Student Reviews", enabled: true, order: 1 },
  { id: "creator-collaborations", name: "Creator Collaborations", enabled: true, order: 2 },
];

const defaultContent = {
  links: {
    googlePlay: "https://play.google.com/store/apps/details?id=app.kritamcqs.androidapp",
    dashboard: "https://app.kritamcqs.com/cta?target=%2Fdashboard",
    premium: "https://app.kritamcqs.com/cta?target=%2Fsubscription",
    contact: "#contact",
    whatsapp: "https://wa.me/917010313880",
  },
  ctas: {
    navbar: {
      label: "Download App",
      href: "https://play.google.com/store/apps/details?id=app.kritamcqs.androidapp",
      linkKey: "googlePlay",
    },
  },
  brand: { logo: "" },
  hero: {
    badge: "Silicon Mobile App of the Year 2026",
    title: "India's Smartest Rank Improvement Engine for NEET & JEE",
    tagline: "Practice. Analyze. Improve. Rank.",
    kicker: "Not just another MCQ app.",
    description: "Krita continuously identifies your weak areas, tracks mistakes, creates revision plans, predicts your score, and helps improve your NEET & JEE performance.",
    primaryCta: "Download on Google Play",
    primaryCtaHref: "https://play.google.com/store/apps/details?id=app.kritamcqs.androidapp",
    primaryCtaLinkKey: "googlePlay",
    secondaryCta: "View Dashboard",
    secondaryCtaHref: "#dashboard",
    secondaryCtaLinkKey: "",
    benefits: ["Weak Area Detection", "Mistake Book", "Smart Revision", "Daily Adaptive Tests", "Score Prediction", "Previous Year Questions", "Mock Tests"],
  },
  screens: { dashboard: "", weak: "", mistake: "", revision: "", daily: "" },
  sectionImages: {
    hero: "",
    features: "",
    dashboard: "",
    howItWorks: "",
    pricing: "",
    comparison: "",
    roadmap: "",
    faq: "",
    contact: "",
    finalCta: "",
    footer: "",
  },
  features: {
    title: "Why Students Choose Krita",
    items: [
      { title: "Weak Area Detection", description: "Spot chapters and topics holding your score back.", screen: "weak", highlight: true },
      { title: "Mistake Book", description: "Turn every wrong answer into a revision cue.", screen: "mistake" },
      { title: "Smart Revision Engine", description: "Practice questions built from your real mistakes.", screen: "revision" },
      { title: "Daily Adaptive Practice", description: "Fresh daily questions for practice, weak areas, and revision.", screen: "daily" },
    ],
  },
  dashboard: {
    title: "Your Personal Rank Improvement Dashboard",
    subtitle: "Monitor:",
    cta: "Open Dashboard",
    ctaHref: "https://app.kritamcqs.com/cta?target=%2Fdashboard",
    ctaLinkKey: "dashboard",
    metrics: ["Accuracy %", "Average Time", "Weak Topics", "Improvement Trend", "Predicted Score", "Daily Progress"],
  },
  howItWorks: {
    title: "How Krita Rank Improvement Engine Works",
    steps: [
      { title: "Practice", detail: "Attempt focused MCQs daily." },
      { title: "Analyze", detail: "See weak chapters and trends." },
      { title: "Learn", detail: "Review explanations and mistakes." },
      { title: "Improve", detail: "Revise what matters most." },
      { title: "Predict Rank", detail: "Track score movement before exams." },
    ],
  },
  pricing: {
    plans: [
      { title: "Free Plan", description: "Perfect for daily learning.", cta: "Download Free", linkKey: "googlePlay", features: ["20 Daily MCQs", "15 Revision Questions", "1 Mock Test", "Basic Analysis", "Progress Tracking"] },
      { title: "Premium Plan", price: "Rs.499 / 6 Months", strikeOutAmount: "Rs.3,999", description: "Unlock complete exam preparation.", cta: "Upgrade to Premium", linkKey: "premium", premium: true, features: ["5000+ MCQs", "10 Years PYQs", "Subject Practice", "Weak Analytics", "Mistake Book", "Score Prediction", "Premium Mocks", "Detailed Explanations"] },
    ],
  },
  comparison: {
    title: "What Makes Krita Different?",
    othersTitle: "Others",
    othersItem: "Show Questions",
    kritaTitle: "Krita",
    kritaItems: ["Shows Questions", "Tracks Mistakes", "Detects Weak Areas", "Creates Revision Plans", "Predicts Exam Score", "Improves Rank"],
  },
  roadmap: {
    title: "Real NEET & JEE Learning Workflow",
    workflow: ["Choose NEET / JEE", "Practice Questions", "Take Mock Tests", "Review Mistakes", "Revise Weak Areas", "Improve Accuracy", "Improve Score", "Improve Rank"],
  },
  faq: {
    title: "Frequently Asked Questions",
    items: [
      { q: "Is Krita suitable for NEET?", a: "Yes." },
      { q: "Is Krita suitable for JEE?", a: "Yes." },
      { q: "Is there a free version?", a: "Yes." },
      { q: "What is included in Premium?", a: "5000+ MCQs, PYQs, Mock Tests, Weak Area Analytics, Mistake Book and more." },
      { q: "How much does Premium cost?", a: "Rs.499 for 6 months." },
    ],
  },
  instagramVideos: {
    enabled: true,
    title: "See Krita MCQs in action",
    subtitle: "Play our latest Instagram videos right here and get a quick look at how Krita helps NEET and JEE students practice smarter.",
    description: "Join thousands of aspirants preparing smarter",
    ctaText: "View all reels on Instagram",
    autoPlay: false,
    defaultVideoId: "krita-reel-default",
    profileUrl: "https://www.instagram.com/krita_mcqs.official/",
    tabs: structuredClone(defaultInstagramTabs),
    stats: {
      items: [
        { enabled: true, type: "metric", icon: "users", tone: "blue", value: "1,00,000+", label: "Happy Students" },
        { enabled: true, type: "metric", icon: "star", tone: "yellow", value: "4.8/5", label: "Average Rating" },
        { enabled: true, type: "android", label: "Android App", linkKey: "googlePlay" },
        { enabled: true, type: "ios", label: "iOS App", href: "https://apps.apple.com/in/app/krita-neet-jee-mcqs-pyqs/id6782789640" },
      ],
    },
    items: [
      {
        id: "krita-reel-default",
        title: "Krita MCQs Reel",
        description: "A quick look at Krita MCQs.",
        url: "https://www.instagram.com/reel/DZYtqECzGGY/",
        videoUrl: "",
        thumbnailUrl: "",
        tabId: "student-reviews",
        category: "Student Reviews",
        type: "student-reviews",
        enabled: true,
        order: 1,
      },
    ],
  },
  contact: {
    title: "Get in touch with Team Krita",
    description: "Have questions about our rank improvement engine? Our team of experts is here to help you navigate your NEET & JEE journey.",
    email: "kritamcqs@gmail.com",
    phone: "+91 7010313880 / +91 9176636432",
    address: "NO: 13/9 , First floor, Thayumanavar Street, East Pondy Road, Near Vallalar Temple Backside LIC, Villupuram, 605602.",
  },
  finalCta: {
    eyebrow: "Join 10,000+ NEET & JEE Aspirants",
    title: "Stop Random Studying\nStart Smart Preparation.",
    words: ["Practice.", "Analyze.", "Improve.", "Rank."],
    buttons: [
      { label: "Google Play", linkKey: "googlePlay", icon: "download" },
      { label: "App Store", linkKey: "contact", icon: "phone" },
    ],
  },
  footer: {
    description: "India's smart rank improvement engine for NEET & JEE preparation.",
    copyright: "Copyright 2026 Krita Technosolutions. All rights reserved.",
  },
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? "https://adminapi.kritamcqs.com/api" : "http://localhost:3001/api");
const sections = [
  ["general", "General"],
  ["hero", "Hero"],
  ["screens", "Images"],
  ["features", "Features"],
  ["dashboard", "Dashboard"],
  ["howItWorks", "How It Works"],
  ["pricing", "Pricing"],
  ["comparison", "Comparison"],
  ["roadmap", "Roadmap"],
  ["faq", "FAQ"],
  ["instagramVideos", "Instagram Videos"],
  ["contact", "Contact"],
  ["finalCta", "Final CTA"],
  ["footer", "Footer"],
  ["advanced", "Advanced"],
];
const screenOptions = ["dashboard", "weak", "mistake", "revision", "daily"];
const sectionImageOptions = ["hero", "features", "dashboard", "howItWorks", "pricing", "comparison", "roadmap", "faq", "contact", "finalCta", "footer"];
const linkKeys = ["", "googlePlay", "dashboard", "premium", "contact", "whatsapp"];

function mergeContent(base, override) {
  if (!override || typeof override !== "object" || Array.isArray(override)) return base;
  const output = { ...base };
  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === "object" && !Array.isArray(value) && base[key] && typeof base[key] === "object" && !Array.isArray(base[key])) {
      output[key] = mergeContent(base[key], value);
    } else {
      output[key] = value;
    }
  }
  return output;
}

function getIn(source, path, fallback = "") {
  return path.split(".").reduce((current, key) => current?.[key], source) ?? fallback;
}

function setIn(source, path, value) {
  const keys = path.split(".");
  const clone = structuredClone(source);
  let current = clone;
  keys.slice(0, -1).forEach((key) => {
    if (!current[key] || typeof current[key] !== "object") current[key] = {};
    current = current[key];
  });
  current[keys[keys.length - 1]] = value;
  return clone;
}

function assetUrl(value) {
  if (!value || !String(value).startsWith("/uploads/")) return value;
  return `${API_BASE_URL.replace(/\/api\/?$/, "")}${value}`;
}

function emptyFeature() {
  return { title: "New Feature", description: "", screen: "dashboard", highlight: false };
}

function emptyStep() {
  return { title: "New Step", detail: "" };
}

function emptyFaq() {
  return { q: "New Question", a: "" };
}

function emptyPlan() {
  return { title: "New Plan", price: "", strikeOutAmount: "", description: "", cta: "Learn More", href: "", linkKey: "googlePlay", premium: false, features: ["Feature"] };
}

function emptyButton() {
  return { label: "New Button", href: "", linkKey: "contact", icon: "phone" };
}

function emptyInstagramVideo(order = 1) {
  return {
    id: `instagram-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "New Instagram Video",
    description: "",
    studentName: "",
    badge: "",
    duration: "",
    views: "",
    likes: "",
    comments: "",
    url: "",
    videoUrl: "",
    thumbnailUrl: "",
    tabId: defaultInstagramTabs[0].id,
    category: defaultInstagramTabs[0].name,
    type: defaultInstagramTabs[0].id,
    enabled: true,
    order,
  };
}

function emptyInstagramTab(order = 1) {
  return {
    id: `instagram-tab-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: "New Tab",
    enabled: true,
    order,
  };
}

function normalizeInstagramTabs(tabs) {
  const source = Array.isArray(tabs) && tabs.length ? tabs : defaultInstagramTabs;
  return source
    .map((tab, index) => ({
      id: String(tab?.id || `instagram-tab-${index + 1}`).trim() || `instagram-tab-${index + 1}`,
      name: String(tab?.name || tab?.label || `Tab ${index + 1}`).trim() || `Tab ${index + 1}`,
      enabled: tab?.enabled !== false,
      order: Number(tab?.order || index + 1),
    }))
    .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    .map((tab, index) => ({ ...tab, order: index + 1 }));
}

function tabPatchFor(tabId, tabs) {
  const tab = tabs.find((item) => item.id === tabId);
  return { tabId, category: tab?.name || "", type: tabId };
}

function slugifyTabLabel(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function resolveInstagramVideoTabId(item, tabs) {
  const directTabId = String(item?.tabId || "").trim();
  if (directTabId && tabs.some((tab) => tab.id === directTabId)) return directTabId;

  const category = String(item?.category || "").trim();
  if (category) {
    const categorySlug = slugifyTabLabel(category);
    const matchedTab = tabs.find((tab) => tab.name.toLowerCase() === category.toLowerCase() || slugifyTabLabel(tab.name) === categorySlug);
    if (matchedTab) return matchedTab.id;
  }

  const legacyType = String(item?.type || "").trim();
  if (legacyType && tabs.some((tab) => tab.id === legacyType)) return legacyType;

  const legacy = `${category || legacyType}`.toLowerCase();
  if (legacy.includes("creator") || legacy.includes("collab")) {
    const creatorTab = tabs.find((tab) => tab.id === "creator-collaborations" || tab.name.toLowerCase().includes("creator"));
    return creatorTab?.id || tabs[0]?.id || "";
  }
  if (legacy.includes("student") || legacy.includes("review")) {
    const studentTab = tabs.find((tab) => tab.id === "student-reviews" || tab.name.toLowerCase().includes("student"));
    return studentTab?.id || tabs[0]?.id || "";
  }

  return tabs[0]?.id || "";
}

function normalizeInstagramVideosConfig(value) {
  const config = value && typeof value === "object" ? value : defaultContent.instagramVideos;
  const tabs = normalizeInstagramTabs(config.tabs);
  const items = Array.isArray(config.items) ? config.items : [];
  return {
    ...config,
    tabs,
    items: items
      .map((item, index) => {
        const tabId = resolveInstagramVideoTabId(item, tabs);
        return {
          ...item,
          ...tabPatchFor(tabId, tabs),
          order: Number(item?.order || index + 1),
        };
      })
      .sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
      .map((item, index) => ({ ...item, order: index + 1 })),
  };
}

function normalizeWebsiteContentForPublish(value) {
  const nextContent = value && typeof value === "object" ? structuredClone(value) : structuredClone(defaultContent);
  nextContent.instagramVideos = normalizeInstagramVideosConfig(nextContent.instagramVideos);
  return nextContent;
}

function defaultInstagramStat(index = 0) {
  const defaults = defaultContent.instagramVideos.stats.items;
  return structuredClone(defaults[index] || { enabled: true, type: "metric", icon: "users", tone: "blue", value: "500+", label: "New Card" });
}

export function WebsiteContentPage() {
  const [content, setContent] = useState(defaultContent);
  const contentRef = useRef(defaultContent);
  const [activeSection, setActiveSection] = useState("general");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [uploadingPath, setUploadingPath] = useState("");
  const [advancedText, setAdvancedText] = useState(JSON.stringify(defaultContent, null, 2));

  const advancedParsed = useMemo(() => {
    try {
      return { ok: true, value: JSON.parse(advancedText) };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }, [advancedText]);

  function update(path, value) {
    const nextContent = setIn(contentRef.current, path, value);
    contentRef.current = nextContent;
    setContent(nextContent);
  }

  function updateArray(path, updater) {
    const list = Array.isArray(getIn(content, path, [])) ? getIn(content, path, []) : [];
    update(path, updater(list));
  }

  async function loadContent() {
    setStatus("loading");
    setMessage("");
    try {
      const response = await websiteContentService.getLanding();
      const nextContent = normalizeWebsiteContentForPublish(mergeContent(defaultContent, response.data?.content || {}));
      contentRef.current = nextContent;
      setContent(nextContent);
      setAdvancedText(JSON.stringify(nextContent, null, 2));
      setStatus("idle");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to load website content.");
    }
  }

  useEffect(() => {
    void loadContent();
  }, []);

  async function saveContent() {
    const payload = normalizeWebsiteContentForPublish(activeSection === "advanced" && advancedParsed.ok ? advancedParsed.value : contentRef.current);
    if (activeSection === "advanced" && !advancedParsed.ok) {
      setStatus("error");
      setMessage(`JSON error: ${advancedParsed.error}`);
      return;
    }

    setStatus("saving");
    setMessage("");
    try {
      const response = await websiteContentService.updateLanding({ content: payload, status: "published" });
      const savedContent = response.data?.content && typeof response.data.content === "object" ? response.data.content : payload;
      const nextContent = normalizeWebsiteContentForPublish(mergeContent(defaultContent, savedContent));
      contentRef.current = nextContent;
      setContent(nextContent);
      setAdvancedText(JSON.stringify(nextContent, null, 2));
      setStatus("idle");
      setMessage("Website content published successfully.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to save website content.");
    }
  }

  async function uploadImage(path, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPath(path);
    setMessage("");
    try {
      const response = await uploadService.appImage(file, "website-content");
      const nextUrl = response.data?.url || response.data?.path || response.url || "";
      update(path, nextUrl);
      setMessage("Image uploaded and applied to this section.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to upload image.");
    } finally {
      setUploadingPath("");
      event.target.value = "";
    }
  }

  async function uploadVideo(path, event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingPath(path);
    setMessage("");
    try {
      const response = await uploadService.appVideo(file, "website-content/videos");
      const nextUrl = response.data?.url || response.data?.path || response.url || "";
      update(path, nextUrl);
      setMessage("Video uploaded and applied to this section.");
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to upload video.");
    } finally {
      setUploadingPath("");
      event.target.value = "";
    }
  }

  return (
    <div className="space-y-5">
      <div className={ui.sectionHead}>
        <div>
          <p className={ui.eyebrow}>Website Builder</p>
          <h1 className="text-2xl font-black tracking-tight text-slate-950">Landing Page Sections</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-500">
            Manage every landing page section, image, button, and repeatable item from admin without code changes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={loadContent} disabled={status === "loading"}>
            <RefreshCw size={16} />
            Reload
          </button>
          <button type="button" className={cn(ui.buttonBase, ui.buttonPrimary)} onClick={saveContent} disabled={status === "saving"}>
            <Save size={16} />
            {status === "saving" ? "Publishing..." : "Publish"}
          </button>
        </div>
      </div>

      {message ? (
        <div className={`rounded-xl border px-4 py-3 text-sm font-semibold ${status === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[260px_1fr]">
        <aside className={ui.panel}>
          <div className="space-y-1">
            {sections.map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setActiveSection(key);
                  if (key === "advanced") setAdvancedText(JSON.stringify(contentRef.current, null, 2));
                }}
                className={`w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold transition ${activeSection === key ? "bg-sky-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </aside>

        <section className={ui.panel}>
          {activeSection === "general" && (
            <Section title="General Links & Brand">
              <ImageField label="Logo" path="brand.logo" value={getIn(content, "brand.logo")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              <Field label="Google Play Link" path="links.googlePlay" value={getIn(content, "links.googlePlay")} onChange={update} />
              <Field label="Dashboard Link" path="links.dashboard" value={getIn(content, "links.dashboard")} onChange={update} />
              <Field label="Premium Link" path="links.premium" value={getIn(content, "links.premium")} onChange={update} />
              <Field label="Contact Link" path="links.contact" value={getIn(content, "links.contact")} onChange={update} />
              <Field label="WhatsApp Link" path="links.whatsapp" value={getIn(content, "links.whatsapp")} onChange={update} />
              <Field label="Navbar CTA Text" path="ctas.navbar.label" value={getIn(content, "ctas.navbar.label")} onChange={update} />
              <Field label="Navbar CTA Link" path="ctas.navbar.href" value={getIn(content, "ctas.navbar.href")} onChange={update} />
              <SelectPathField label="Navbar CTA Link Key" path="ctas.navbar.linkKey" value={getIn(content, "ctas.navbar.linkKey")} options={linkKeys} onChange={update} />
            </Section>
          )}

          {activeSection === "hero" && (
            <Section title="Hero Section">
              <Field label="Award Badge" path="hero.badge" value={getIn(content, "hero.badge")} onChange={update} />
              <Field label="Title" path="hero.title" value={getIn(content, "hero.title")} onChange={update} />
              <Field label="Tagline" path="hero.tagline" value={getIn(content, "hero.tagline")} onChange={update} />
              <Field label="Kicker" path="hero.kicker" value={getIn(content, "hero.kicker")} onChange={update} />
              <TextareaField label="Description" path="hero.description" value={getIn(content, "hero.description")} onChange={update} />
              <Field label="Primary Button Text" path="hero.primaryCta" value={getIn(content, "hero.primaryCta")} onChange={update} />
              <Field label="Primary Button Link" path="hero.primaryCtaHref" value={getIn(content, "hero.primaryCtaHref")} onChange={update} />
              <SelectPathField label="Primary Link Key" path="hero.primaryCtaLinkKey" value={getIn(content, "hero.primaryCtaLinkKey")} options={linkKeys} onChange={update} />
              <Field label="Secondary Button Text" path="hero.secondaryCta" value={getIn(content, "hero.secondaryCta")} onChange={update} />
              <Field label="Secondary Button Link" path="hero.secondaryCtaHref" value={getIn(content, "hero.secondaryCtaHref")} onChange={update} />
              <SelectPathField label="Secondary Link Key" path="hero.secondaryCtaLinkKey" value={getIn(content, "hero.secondaryCtaLinkKey")} options={linkKeys} onChange={update} />
              <ImageField label="Hero Section Image" path="sectionImages.hero" value={getIn(content, "sectionImages.hero")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              <StringList title="Benefit Chips" items={getIn(content, "hero.benefits", [])} onChange={(items) => update("hero.benefits", items)} />
            </Section>
          )}

          {activeSection === "screens" && (
            <Section title="Website & App Images">
              {screenOptions.map((screen) => (
                <ImageField key={screen} label={`${screen[0].toUpperCase()}${screen.slice(1)} Screen`} path={`screens.${screen}`} value={getIn(content, `screens.${screen}`)} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              ))}
              {sectionImageOptions.map((section) => (
                <ImageField key={section} label={`${section} Section Image`} path={`sectionImages.${section}`} value={getIn(content, `sectionImages.${section}`)} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              ))}
            </Section>
          )}

          {activeSection === "features" && (
            <Section title="Features Section">
              <Field label="Section Title" path="features.title" value={getIn(content, "features.title")} onChange={update} />
              <ImageField label="Section Image" path="sectionImages.features" value={getIn(content, "sectionImages.features")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              <FeatureList items={getIn(content, "features.items", [])} onChange={(items) => update("features.items", items)} />
            </Section>
          )}

          {activeSection === "dashboard" && (
            <Section title="Dashboard Section">
              <Field label="Title" path="dashboard.title" value={getIn(content, "dashboard.title")} onChange={update} />
              <Field label="Subtitle" path="dashboard.subtitle" value={getIn(content, "dashboard.subtitle")} onChange={update} />
              <Field label="Button Text" path="dashboard.cta" value={getIn(content, "dashboard.cta")} onChange={update} />
              <Field label="Button Link" path="dashboard.ctaHref" value={getIn(content, "dashboard.ctaHref")} onChange={update} />
              <SelectPathField label="Button Link Key" path="dashboard.ctaLinkKey" value={getIn(content, "dashboard.ctaLinkKey")} options={linkKeys} onChange={update} />
              <ImageField label="Section Image" path="sectionImages.dashboard" value={getIn(content, "sectionImages.dashboard")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              <StringList title="Metrics" items={getIn(content, "dashboard.metrics", [])} onChange={(items) => update("dashboard.metrics", items)} />
            </Section>
          )}

          {activeSection === "howItWorks" && (
            <Section title="How It Works Section">
              <Field label="Section Title" path="howItWorks.title" value={getIn(content, "howItWorks.title")} onChange={update} />
              <ImageField label="Section Image" path="sectionImages.howItWorks" value={getIn(content, "sectionImages.howItWorks")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              <StepList items={getIn(content, "howItWorks.steps", [])} onChange={(items) => update("howItWorks.steps", items)} />
            </Section>
          )}

          {activeSection === "pricing" && (
            <Section title="Pricing Section">
              <ImageField label="Section Image" path="sectionImages.pricing" value={getIn(content, "sectionImages.pricing")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              <PlanList items={getIn(content, "pricing.plans", [])} onChange={(items) => update("pricing.plans", items)} />
            </Section>
          )}

          {activeSection === "comparison" && (
            <Section title="Comparison Section">
              <Field label="Section Title" path="comparison.title" value={getIn(content, "comparison.title")} onChange={update} />
              <Field label="Others Column Title" path="comparison.othersTitle" value={getIn(content, "comparison.othersTitle")} onChange={update} />
              <Field label="Others Item" path="comparison.othersItem" value={getIn(content, "comparison.othersItem")} onChange={update} />
              <Field label="Krita Column Title" path="comparison.kritaTitle" value={getIn(content, "comparison.kritaTitle")} onChange={update} />
              <ImageField label="Section Image" path="sectionImages.comparison" value={getIn(content, "sectionImages.comparison")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              <StringList title="Krita Items" items={getIn(content, "comparison.kritaItems", [])} onChange={(items) => update("comparison.kritaItems", items)} />
            </Section>
          )}

          {activeSection === "roadmap" && (
            <Section title="Roadmap Section">
              <Field label="Section Title" path="roadmap.title" value={getIn(content, "roadmap.title")} onChange={update} />
              <ImageField label="Section Image" path="sectionImages.roadmap" value={getIn(content, "sectionImages.roadmap")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              <StringList title="Workflow Stages" items={getIn(content, "roadmap.workflow", [])} onChange={(items) => update("roadmap.workflow", items)} />
            </Section>
          )}

          {activeSection === "faq" && (
            <Section title="FAQ Section">
              <Field label="Section Title" path="faq.title" value={getIn(content, "faq.title")} onChange={update} />
              <ImageField label="Section Image" path="sectionImages.faq" value={getIn(content, "sectionImages.faq")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              <FaqList items={getIn(content, "faq.items", [])} onChange={(items) => update("faq.items", items)} />
            </Section>
          )}

          {activeSection === "instagramVideos" && (
            <Section title="Instagram Videos">
              <Field label="Section Title" path="instagramVideos.title" value={getIn(content, "instagramVideos.title")} onChange={update} />
              <CheckPathField label="Show Instagram videos section" path="instagramVideos.enabled" checked={Boolean(getIn(content, "instagramVideos.enabled", true))} onChange={update} />
              <TextareaField label="Section Subtitle" path="instagramVideos.subtitle" value={getIn(content, "instagramVideos.subtitle")} onChange={update} />
              <TextareaField label="Bottom Description" path="instagramVideos.description" value={getIn(content, "instagramVideos.description")} onChange={update} />
              <Field label="Profile Button Text" path="instagramVideos.ctaText" value={getIn(content, "instagramVideos.ctaText")} onChange={update} />
              <Field label="View All Videos Profile URL" path="instagramVideos.profileUrl" value={getIn(content, "instagramVideos.profileUrl")} onChange={update} />
              <CheckPathField label="Auto Play selected video" path="instagramVideos.autoPlay" checked={Boolean(getIn(content, "instagramVideos.autoPlay", false))} onChange={update} />
              <InstagramVideoList
                value={getIn(content, "instagramVideos", defaultContent.instagramVideos)}
                onChange={(value) => update("instagramVideos", normalizeInstagramVideosConfig(value))}
                onImageUpload={uploadImage}
                onVideoUpload={uploadVideo}
                uploadingPath={uploadingPath}
              />
            </Section>
          )}

          {activeSection === "contact" && (
            <Section title="Contact Section">
              <Field label="Title" path="contact.title" value={getIn(content, "contact.title")} onChange={update} />
              <TextareaField label="Description" path="contact.description" value={getIn(content, "contact.description")} onChange={update} />
              <Field label="Email" path="contact.email" value={getIn(content, "contact.email")} onChange={update} />
              <Field label="Phone" path="contact.phone" value={getIn(content, "contact.phone")} onChange={update} />
              <TextareaField label="Address" path="contact.address" value={getIn(content, "contact.address")} onChange={update} />
              <ImageField label="Section Image" path="sectionImages.contact" value={getIn(content, "sectionImages.contact")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
            </Section>
          )}

          {activeSection === "finalCta" && (
            <Section title="Final CTA Section">
              <Field label="Eyebrow" path="finalCta.eyebrow" value={getIn(content, "finalCta.eyebrow")} onChange={update} />
              <TextareaField label="Title" path="finalCta.title" value={getIn(content, "finalCta.title")} onChange={update} />
              <ImageField label="Section Image" path="sectionImages.finalCta" value={getIn(content, "sectionImages.finalCta")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
              <StringList title="Word Tiles" items={getIn(content, "finalCta.words", [])} onChange={(items) => update("finalCta.words", items)} />
              <ButtonList items={getIn(content, "finalCta.buttons", [])} onChange={(items) => update("finalCta.buttons", items)} />
            </Section>
          )}

          {activeSection === "footer" && (
            <Section title="Footer Section">
              <TextareaField label="Description" path="footer.description" value={getIn(content, "footer.description")} onChange={update} />
              <Field label="Copyright" path="footer.copyright" value={getIn(content, "footer.copyright")} onChange={update} />
              <ImageField label="Section Image" path="sectionImages.footer" value={getIn(content, "sectionImages.footer")} onUpload={uploadImage} uploadingPath={uploadingPath} onChange={update} />
            </Section>
          )}

          {activeSection === "advanced" && (
            <Section title="Advanced JSON">
              <textarea
                className="min-h-[620px] w-full resize-y rounded-lg border border-slate-200 bg-slate-950 px-4 py-3 font-mono text-xs leading-6 text-slate-50 outline-none transition focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                value={advancedText}
                onChange={(event) => setAdvancedText(event.target.value)}
                spellCheck={false}
              />
              {!advancedParsed.ok ? <p className="mt-3 text-sm font-semibold text-rose-600">JSON error: {advancedParsed.error}</p> : null}
            </Section>
          )}
        </section>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h2 className="mb-5 text-xl font-black tracking-tight text-slate-950">{title}</h2>
      <div className="grid gap-5 lg:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({ label, path, value, onChange, type = "text" }) {
  return (
    <label className={ui.field}>
      {label}
      <input type={type} className={ui.input} value={value || ""} onChange={(event) => onChange(path, event.target.value)} />
    </label>
  );
}

function TextareaField({ label, path, value, onChange }) {
  return (
    <label className={cn(ui.field, "lg:col-span-2")}>
      {label}
      <textarea className={ui.textarea} rows={4} value={value || ""} onChange={(event) => onChange(path, event.target.value)} />
    </label>
  );
}

function ImageField({ label, path, value, onChange, onUpload, uploadingPath }) {
  const preview = assetUrl(value);
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-slate-800">{label}</p>
          <p className="mt-1 text-xs text-slate-500">Upload or paste an image URL/path.</p>
        </div>
        <label className={cn(ui.buttonBase, ui.buttonSecondary, "cursor-pointer")}>
          <Upload size={16} />
          {uploadingPath === path ? "Uploading..." : "Upload"}
          <input type="file" accept="image/*" className="hidden" onChange={(event) => onUpload(path, event)} disabled={uploadingPath === path} />
        </label>
      </div>
      <input className={cn(ui.input, "mt-4")} value={value || ""} onChange={(event) => onChange(path, event.target.value)} placeholder="/uploads/website-content/image.webp" />
      {preview ? (
        <img src={preview} alt={label} className="mt-4 h-40 w-full rounded-lg border border-slate-200 bg-white object-contain" />
      ) : (
        <div className="mt-4 flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-slate-400">
          <Image size={28} />
        </div>
      )}
    </div>
  );
}

function StringList({ title, items, onChange }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <ListHeader title={title} onAdd={() => onChange([...list, "New item"])} />
      <div className="mt-4 space-y-3">
        {list.map((item, index) => (
          <div key={index} className="flex gap-2">
            <input className={ui.input} value={item || ""} onChange={(event) => onChange(list.map((current, itemIndex) => (itemIndex === index ? event.target.value : current)))} />
            <IconButton label="Remove" onClick={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>
              <Trash2 size={16} />
            </IconButton>
          </div>
        ))}
      </div>
    </div>
  );
}

function FeatureList({ items, onChange }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <Repeatable title="Feature Cards" onAdd={() => onChange([...list, emptyFeature()])}>
      {list.map((item, index) => (
        <Card key={index} title={item.title || `Feature ${index + 1}`} onRemove={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>
          <InlineField label="Title" value={item.title} onChange={(value) => onChange(updateItem(list, index, { title: value }))} />
          <InlineField label="Description" value={item.description} onChange={(value) => onChange(updateItem(list, index, { description: value }))} textarea />
          <SelectField label="Screen" value={item.screen || "dashboard"} options={screenOptions} onChange={(value) => onChange(updateItem(list, index, { screen: value }))} />
          <CheckField label="Highlight this card" checked={Boolean(item.highlight)} onChange={(value) => onChange(updateItem(list, index, { highlight: value }))} />
        </Card>
      ))}
    </Repeatable>
  );
}

function StepList({ items, onChange }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <Repeatable title="Steps" onAdd={() => onChange([...list, emptyStep()])}>
      {list.map((item, index) => (
        <Card key={index} title={item.title || `Step ${index + 1}`} onRemove={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>
          <InlineField label="Title" value={item.title} onChange={(value) => onChange(updateItem(list, index, { title: value }))} />
          <InlineField label="Detail" value={item.detail} onChange={(value) => onChange(updateItem(list, index, { detail: value }))} textarea />
        </Card>
      ))}
    </Repeatable>
  );
}

function FaqList({ items, onChange }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <Repeatable title="Questions" onAdd={() => onChange([...list, emptyFaq()])}>
      {list.map((item, index) => (
        <Card key={index} title={item.q || `Question ${index + 1}`} onRemove={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>
          <InlineField label="Question" value={item.q} onChange={(value) => onChange(updateItem(list, index, { q: value }))} />
          <InlineField label="Answer" value={item.a} onChange={(value) => onChange(updateItem(list, index, { a: value }))} textarea />
        </Card>
      ))}
    </Repeatable>
  );
}

function PlanList({ items, onChange }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <Repeatable title="Plans" onAdd={() => onChange([...list, emptyPlan()])}>
      {list.map((item, index) => (
        <Card key={index} title={item.title || `Plan ${index + 1}`} onRemove={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>
          <InlineField label="Title" value={item.title} onChange={(value) => onChange(updateItem(list, index, { title: value }))} />
          <InlineField label="Price" value={item.price} onChange={(value) => onChange(updateItem(list, index, { price: value }))} />
          <InlineField label="Strike Out Amount" value={item.strikeOutAmount || item.originalPrice} onChange={(value) => onChange(updateItem(list, index, { strikeOutAmount: value }))} />
          <InlineField label="Description" value={item.description} onChange={(value) => onChange(updateItem(list, index, { description: value }))} textarea />
          <InlineField label="Button Text" value={item.cta} onChange={(value) => onChange(updateItem(list, index, { cta: value }))} />
          <InlineField label="Button URL" value={item.href} onChange={(value) => onChange(updateItem(list, index, { href: value }))} />
          <SelectField label="Button Link" value={item.linkKey || "googlePlay"} options={linkKeys} onChange={(value) => onChange(updateItem(list, index, { linkKey: value }))} />
          <CheckField label="Premium style" checked={Boolean(item.premium)} onChange={(value) => onChange(updateItem(list, index, { premium: value }))} />
          <StringList title="Plan Features" items={item.features || []} onChange={(features) => onChange(updateItem(list, index, { features }))} />
        </Card>
      ))}
    </Repeatable>
  );
}

function ButtonList({ items, onChange }) {
  const list = Array.isArray(items) ? items : [];
  return (
    <Repeatable title="CTA Buttons" onAdd={() => onChange([...list, emptyButton()])}>
      {list.map((item, index) => (
        <Card key={index} title={item.label || `Button ${index + 1}`} onRemove={() => onChange(list.filter((_, itemIndex) => itemIndex !== index))}>
          <InlineField label="Label" value={item.label} onChange={(value) => onChange(updateItem(list, index, { label: value }))} />
          <InlineField label="URL" value={item.href} onChange={(value) => onChange(updateItem(list, index, { href: value }))} />
          <SelectField label="Link" value={item.linkKey || "contact"} options={linkKeys} onChange={(value) => onChange(updateItem(list, index, { linkKey: value }))} />
          <SelectField label="Icon" value={item.icon || "phone"} options={["download", "phone"]} onChange={(value) => onChange(updateItem(list, index, { icon: value }))} />
        </Card>
      ))}
    </Repeatable>
  );
}

function InstagramVideoList({ value, onChange, onImageUpload, onVideoUpload, uploadingPath }) {
  const config = value && typeof value === "object" ? value : defaultContent.instagramVideos;
  const tabs = normalizeInstagramTabs(config.tabs);
  const tabOptions = tabs.map((tab) => ({ value: tab.id, label: tab.name }));
  const list = Array.isArray(config.items)
    ? [...config.items].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
    : [];
  const stats = Array.isArray(config.stats?.items)
    ? config.stats.items.slice(0, 4)
    : defaultContent.instagramVideos.stats.items;

  function commit(nextItems, patch = {}) {
    const nextTabs = normalizeInstagramTabs(patch.tabs || config.tabs);
    onChange({
      ...config,
      ...patch,
      tabs: nextTabs,
      items: nextItems.map((item, index) => {
        const tabId = resolveInstagramVideoTabId(item, nextTabs);
        return {
          ...item,
          ...tabPatchFor(tabId, nextTabs),
          order: index + 1,
        };
      }),
    });
  }

  function commitTabs(nextTabs) {
    const normalizedTabs = normalizeInstagramTabs(nextTabs);
    const fallbackTabId = normalizedTabs[0]?.id || "";
    onChange({
      ...config,
      tabs: normalizedTabs,
      items: list.map((item) => ({
        ...item,
        ...tabPatchFor(resolveInstagramVideoTabId(item, normalizedTabs) || fallbackTabId, normalizedTabs),
      })),
    });
  }

  function addTab() {
    commitTabs([...tabs, emptyInstagramTab(tabs.length + 1)]);
  }

  function updateTab(index, patch) {
    commitTabs(tabs.map((tab, tabIndex) => (tabIndex === index ? { ...tab, ...patch } : tab)));
  }

  function removeTab(index) {
    if (tabs.length <= 1) return;
    commitTabs(tabs.filter((_, tabIndex) => tabIndex !== index));
  }

  function moveTab(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= tabs.length) return;
    const nextTabs = [...tabs];
    const [tab] = nextTabs.splice(index, 1);
    nextTabs.splice(target, 0, tab);
    commitTabs(nextTabs);
  }

  function updateVideo(index, patch) {
    commit(list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  function removeVideo(index) {
    const removedId = list[index]?.id;
    const nextItems = list.filter((_, itemIndex) => itemIndex !== index);
    const patch = removedId && config.defaultVideoId === removedId ? { defaultVideoId: nextItems.find((item) => item.enabled !== false)?.id || "" } : {};
    commit(nextItems, patch);
  }

  function moveVideo(index, direction) {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const nextItems = [...list];
    const [item] = nextItems.splice(index, 1);
    nextItems.splice(target, 0, item);
    commit(nextItems);
  }

  function updateStat(index, patch) {
    const nextStats = [...stats];
    nextStats[index] = { ...defaultInstagramStat(index), ...(nextStats[index] || {}), ...patch };
    onChange({
      ...config,
      stats: { ...(config.stats || {}), items: nextStats },
    });
  }

  return (
    <>
    <Repeatable title="Tabs Management" onAdd={addTab}>
      <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-800">
        Tabs shown here appear on the website automatically. Assign each reel to a tab below.
      </div>
      {tabs.map((tab, index) => (
        <Card key={tab.id} title={`${index + 1}. ${tab.name || "Instagram Tab"}`} onRemove={tabs.length > 1 ? () => removeTab(index) : undefined}>
          <InlineField label="Tab Name" value={tab.name} onChange={(name) => updateTab(index, { name })} />
          <CheckField label="Enable this tab" checked={tab.enabled !== false} onChange={(enabled) => updateTab(index, { enabled })} />
          <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
            <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => moveTab(index, -1)} disabled={index === 0}>
              <ArrowUp size={16} /> Move Up
            </button>
            <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => moveTab(index, 1)} disabled={index === tabs.length - 1}>
              <ArrowDown size={16} /> Move Down
            </button>
            <span className="text-xs font-semibold text-slate-500">ID: {tab.id}</span>
          </div>
        </Card>
      ))}
    </Repeatable>
    <Repeatable title="Instagram Video Links" onAdd={() => commit([...list, emptyInstagramVideo(list.length + 1)])}>
      <div className="rounded-lg border border-sky-100 bg-sky-50 px-4 py-3 text-xs font-semibold text-sky-800">
        Use the Instagram URL for reference. Upload a video or paste a direct MP4/WebM URL for the custom website player; thumbnails are optional because the website can preview the video frame automatically.
      </div>
      {list.map((item, index) => {
        const invalid = item.url && !isInstagramUrl(item.url);
        const missingVideo = !item.videoUrl;
        const isDefault = config.defaultVideoId === item.id;
        const selectedTabId = resolveInstagramVideoTabId(item, tabs);
        const selectedTab = tabs.find((tab) => tab.id === selectedTabId);
        return (
          <Card key={item.id || index} title={`${index + 1}. ${item.title || "Instagram Video"}`} onRemove={() => removeVideo(index)}>
            <InlineField label="Title" value={item.title} onChange={(title) => updateVideo(index, { title })} />
            <InlineField label="Student / Author Name" value={item.studentName} onChange={(studentName) => updateVideo(index, { studentName })} />
            <InlineField label="Badge" value={item.badge} onChange={(badge) => updateVideo(index, { badge })} />
            <div className={ui.field}>
              <SelectField label="Tab / Category" value={selectedTabId || tabs[0]?.id || ""} options={tabOptions} onChange={(tabId) => updateVideo(index, tabPatchFor(tabId, tabs))} />
              <p className="text-xs font-semibold text-slate-500">Selected tab: {selectedTab?.name || "Unassigned"}</p>
            </div>
            <InlineField label="Instagram URL" value={item.url} onChange={(url) => updateVideo(index, { url })} />
            <div className={ui.field}>
              Playable Video URL / Upload
              <div className="flex gap-2">
                <input className={ui.input} value={item.videoUrl || ""} onChange={(event) => updateVideo(index, { videoUrl: event.target.value })} placeholder="https://.../video.mp4 or /uploads/..." />
                <label className={cn(ui.buttonBase, ui.buttonSecondary, "shrink-0 cursor-pointer")}>
                  <Upload size={16} />
                  {uploadingPath === `instagramVideos.items.${index}.videoUrl` ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    disabled={uploadingPath === `instagramVideos.items.${index}.videoUrl`}
                    onChange={(event) => onVideoUpload(`instagramVideos.items.${index}.videoUrl`, event)}
                  />
                </label>
              </div>
            </div>
            <div className={ui.field}>
              Thumbnail URL
              <div className="flex gap-2">
                <input className={ui.input} value={item.thumbnailUrl || ""} onChange={(event) => updateVideo(index, { thumbnailUrl: event.target.value })} placeholder="https://.../thumbnail.jpg or /uploads/..." />
                <label className={cn(ui.buttonBase, ui.buttonSecondary, "shrink-0 cursor-pointer")}>
                  <Upload size={16} />
                  {uploadingPath === `instagramVideos.items.${index}.thumbnailUrl` ? "Uploading..." : "Upload"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingPath === `instagramVideos.items.${index}.thumbnailUrl`}
                    onChange={(event) => onImageUpload(`instagramVideos.items.${index}.thumbnailUrl`, event)}
                  />
                </label>
              </div>
              {item.thumbnailUrl ? <img src={assetUrl(item.thumbnailUrl)} alt={item.title || "Video thumbnail"} className="mt-3 h-36 w-24 rounded-lg border border-slate-200 bg-white object-cover" /> : null}
            </div>
            <InlineField label="Description" value={item.description} onChange={(description) => updateVideo(index, { description })} textarea />
            <InlineField label="Duration" value={item.duration} onChange={(duration) => updateVideo(index, { duration })} />
            <InlineField label="Views" value={item.views} onChange={(views) => updateVideo(index, { views })} />
            <InlineField label="Likes" value={item.likes} onChange={(likes) => updateVideo(index, { likes })} />
            <InlineField label="Comments" value={item.comments} onChange={(comments) => updateVideo(index, { comments })} />
            <CheckField label="Enable this video" checked={item.enabled !== false} onChange={(enabled) => updateVideo(index, { enabled })} />
            <div className="flex flex-wrap items-center gap-2 lg:col-span-2">
              <button type="button" className={cn(ui.buttonBase, isDefault ? ui.buttonPrimary : ui.buttonSecondary)} onClick={() => onChange({ ...config, defaultVideoId: item.id })}>
                {isDefault ? "Default Video" : "Set Default"}
              </button>
              <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => moveVideo(index, -1)} disabled={index === 0}>
                <ArrowUp size={16} /> Move Up
              </button>
              <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={() => moveVideo(index, 1)} disabled={index === list.length - 1}>
                <ArrowDown size={16} /> Move Down
              </button>
              <button type="button" className={cn(ui.buttonBase, item.enabled === false ? ui.buttonSecondary : ui.buttonGhost)} onClick={() => updateVideo(index, { enabled: item.enabled === false })}>
                {item.enabled === false ? <Eye size={16} /> : <EyeOff size={16} />}
                {item.enabled === false ? "Enable" : "Disable"}
              </button>
            </div>
            {invalid ? <p className="text-sm font-semibold text-rose-600 lg:col-span-2">Enter a valid Instagram reel, post, or TV URL.</p> : null}
            {missingVideo ? <p className="text-sm font-semibold text-amber-600 lg:col-span-2">Add a playable video URL or upload a video so the website can show this without Instagram UI. A normal Instagram page link cannot be used by the custom player.</p> : null}
          </Card>
        );
      })}
      {!list.length ? <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm font-semibold text-slate-500">No Instagram videos added.</div> : null}
    </Repeatable>
    <Repeatable title="Review / Download Cards" onAdd={() => null}>
      {Array.from({ length: 4 }).map((_, index) => {
        const item = { ...defaultInstagramStat(index), ...(stats[index] || {}) };
        const type = item.type || (index >= 2 ? (index === 2 ? "android" : "ios") : "metric");
        return (
          <Card key={index} title={`${index + 1}. ${item.label || "Card"}`} onRemove={undefined}>
            <SelectField label="Card Type" value={type} options={["metric", "android", "ios"]} onChange={(value) => updateStat(index, { type: value })} />
            <CheckField label="Enable this card" checked={item.enabled !== false} onChange={(enabled) => updateStat(index, { enabled })} />
            {type === "metric" ? (
              <>
                <InlineField label="Value" value={item.value} onChange={(value) => updateStat(index, { value })} />
                <InlineField label="Label" value={item.label} onChange={(label) => updateStat(index, { label })} />
                <SelectField label="Icon" value={item.icon || "users"} options={["users", "star", "play", "quote"]} onChange={(icon) => updateStat(index, { icon })} />
                <SelectField label="Color" value={item.tone || "blue"} options={["blue", "yellow", "rose", "purple"]} onChange={(tone) => updateStat(index, { tone })} />
              </>
            ) : (
              <>
                <InlineField label="Accessible Label" value={item.label} onChange={(label) => updateStat(index, { label })} />
                <SelectField label="Link Key" value={item.linkKey || (type === "android" ? "googlePlay" : "")} options={linkKeys} onChange={(linkKey) => updateStat(index, { linkKey })} />
                <InlineField label="Custom URL" value={item.href} onChange={(href) => updateStat(index, { href })} />
              </>
            )}
          </Card>
        );
      })}
    </Repeatable>
    </>
  );
}

function Repeatable({ title, onAdd, children }) {
  return (
    <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <ListHeader title={title} onAdd={onAdd} />
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}

function ListHeader({ title, onAdd }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h3 className="text-base font-black text-slate-900">{title}</h3>
      {onAdd ? (
        <button type="button" className={cn(ui.buttonBase, ui.buttonSecondary)} onClick={onAdd}>
          <Plus size={16} />
          Add
        </button>
      ) : null}
    </div>
  );
}

function Card({ title, onRemove, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h4 className="font-bold text-slate-900">{title}</h4>
        {onRemove ? (
          <IconButton label="Remove" onClick={onRemove}>
            <Trash2 size={16} />
          </IconButton>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </div>
  );
}

function InlineField({ label, value, onChange, textarea = false }) {
  return (
    <label className={cn(ui.field, textarea && "lg:col-span-2")}>
      {label}
      {textarea ? (
        <textarea className={ui.textarea} rows={3} value={value || ""} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={ui.input} value={value || ""} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <label className={ui.field}>
      {label}
      <select className={ui.input} value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map((option) => {
          const optionValue = typeof option === "object" ? option.value : option;
          const optionLabel = typeof option === "object" ? option.label : option || "Custom URL";
          return <option key={optionValue || "custom"} value={optionValue}>{optionLabel}</option>;
        })}
      </select>
    </label>
  );
}

function SelectPathField({ label, path, value, options, onChange }) {
  return (
    <label className={ui.field}>
      {label}
      <select className={ui.input} value={value || ""} onChange={(event) => onChange(path, event.target.value)}>
        {options.map((option) => (
          <option key={option || "custom"} value={option}>{option || "Custom URL"}</option>
        ))}
      </select>
    </label>
  );
}

function CheckField({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">
      <input type="checkbox" className={ui.checkbox} checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {label}
    </label>
  );
}

function CheckPathField({ label, path, checked, onChange }) {
  return <CheckField label={label} checked={checked} onChange={(value) => onChange(path, value)} />;
}

function isInstagramUrl(value) {
  return /^https?:\/\/(www\.)?instagram\.com\/(reel|p|tv)\/[A-Za-z0-9_-]+\/?/i.test(String(value || "").trim());
}

function IconButton({ label, onClick, children }) {
  return (
    <button type="button" aria-label={label} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600" onClick={onClick}>
      {children}
    </button>
  );
}

function updateItem(list, index, patch) {
  return list.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
}
