import React, { useEffect, useState } from "react";
import { Save, ArrowLeft } from "lucide-react";

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("gemini-2.0-flash-exp");
  const [language, setLanguage] = useState("en");

  useEffect(() => {
    chrome.storage.local.get(
      ["apiKey", "baseUrl", "model", "language"],
      (result) => {
        setApiKey(
          (result.apiKey as string) || import.meta.env.VITE_API_KEY || "",
        );
        setBaseUrl(
          (result.baseUrl as string) || import.meta.env.VITE_BASE_URL || "",
        );
        setModel(
          (result.model as string) ||
            import.meta.env.VITE_MODEL ||
            "gemini-3-flash",
        );
        setLanguage(
          (result.language as string) || import.meta.env.VITE_LANGUAGE || "en",
        );
      },
    );
  }, []);

  const handleSave = () => {
    chrome.storage.local.set({ apiKey, baseUrl, model, language }, () => {
      onBack();
    });
  };

  return (
    <div className="settings-page" style={{ padding: "20px" }}>
      <div
        style={{ display: "flex", alignItems: "center", marginBottom: "20px" }}
      >
        <button
          onClick={onBack}
          style={{
            background: "none",
            border: "none",
            color: "inherit",
            padding: 0,
            marginRight: "10px",
          }}
        >
          <ArrowLeft size={24} />
        </button>
        <h2>Settings</h2>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
        >
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Enter your API Key"
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            background: "var(--input-bg)",
            color: "inherit",
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
        >
          Base URL (Optional)
        </label>
        <input
          type="text"
          value={baseUrl}
          onChange={(e) => setBaseUrl(e.target.value)}
          placeholder="https://api.openai.com/v1"
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            background: "var(--input-bg)",
            color: "inherit",
          }}
        />
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
        >
          Model Name
        </label>
        <input
          type="text"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          placeholder="gemini-2.0-flash-exp"
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            background: "var(--input-bg)",
            color: "inherit",
          }}
        />
      </div>

      <div style={{ marginBottom: "24px" }}>
        <label
          style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}
        >
          Language
        </label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid var(--border-color)",
            background: "var(--input-bg)",
            color: "inherit",
          }}
        >
          <option value="en">English</option>
          <option value="zh">Chinese (Simplified)</option>
        </select>
      </div>

      <button
        onClick={handleSave}
        style={{
          width: "100%",
          padding: "10px",
          backgroundColor: "var(--primary-color)",
          color: "white",
          border: "none",
          borderRadius: "6px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          fontWeight: "bold",
        }}
      >
        <Save size={18} />
        Save Settings
      </button>
    </div>
  );
};
