import { websiteSettingsService } from "../api/websiteSettingsService";
import { EntityManagerPage } from "./common/EntityManagerPage";

const websiteModes = () => [
  { label: "Single Page Landing Website", value: "single" },
  { label: "Multiple Page Website", value: "multiple" },
];

const navbarStyles = () => [
  { label: "Navbar Style 1", value: "style1" },
  { label: "Navbar Style 2", value: "style2" },
  { label: "Navbar Style 3", value: "style3" },
  { label: "Center Logo Layout", value: "centerLogo" },
  { label: "Left Logo Layout", value: "leftLogo" },
];

const footerLayouts = () => [
  { label: "Footer Layout 1", value: "layout1" },
  { label: "Footer Layout 2", value: "layout2" },
  { label: "Footer Layout 3", value: "layout3" },
];

export function WebsiteSettingsBuilderPage() {
  return (
    <EntityManagerPage
      title="Website Settings"
      description="Switch website mode and manage navbar, footer, colors, logo, CTA, and mobile menu behavior."
      service={websiteSettingsService}
      canBulkDelete={false}
      fields={[
        { name: "websiteMode", label: "Website Mode", type: "select", options: websiteModes, defaultValue: "single" },
        { name: "navbarStyle", label: "Navbar Layout", type: "select", options: navbarStyles, defaultValue: "style1" },
        { name: "stickyNavbar", label: "Sticky Navbar", type: "checkbox", toggleLabel: "Sticky navbar", defaultValue: true },
        { name: "transparentNavbar", label: "Transparent Navbar", type: "checkbox", toggleLabel: "Transparent navbar", defaultValue: false },
        { name: "logoUrl", label: "Logo URL" },
        { name: "primaryColor", label: "Primary Color", defaultValue: "#2563eb" },
        { name: "backgroundColor", label: "Background Color", defaultValue: "#ffffff" },
        { name: "menuTextColor", label: "Menu Text Color", defaultValue: "#0f172a" },
        { name: "ctaEnabled", label: "CTA Button", type: "checkbox", toggleLabel: "Enable button", defaultValue: true },
        { name: "ctaLabel", label: "CTA Label", defaultValue: "Download App" },
        { name: "ctaHref", label: "CTA Link" },
        { name: "mobileMenuEnabled", label: "Mobile Menu", type: "checkbox", toggleLabel: "Enable mobile menu", defaultValue: true },
        { name: "footerLayout", label: "Footer Layout", type: "select", options: footerLayouts, defaultValue: "layout1" },
        { name: "footerMenusEnabled", label: "Footer Menus", type: "checkbox", toggleLabel: "Enable footer menus", defaultValue: true },
        { name: "copyrightText", label: "Copyright Text" },
        { name: "active", label: "Active", type: "checkbox", toggleLabel: "Active", defaultValue: true },
      ]}
      columns={[
        { key: "websiteMode", label: "Mode" },
        { key: "navbarStyle", label: "Navbar" },
        { key: "footerLayout", label: "Footer" },
        { key: "ctaLabel", label: "CTA" },
        { key: "active", label: "Active", render: (row) => row.active ? "Yes" : "No" },
      ]}
    />
  );
}
