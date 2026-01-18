import { Save, ArrowLeft, Eye, EyeOff, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";

interface SettingsProps {
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ onBack }) => {
  const { t, i18n } = useTranslation();
  const [apiKey, setApiKey] = useState("");

  const [elevenLabsKey, setElevenLabsKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("gemini-2.0-flash-exp");
  const [language, setLanguage] = useState("en");
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showElevenLabsKey, setShowElevenLabsKey] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(
      [
        "apiKey",
        "elevenLabsKey",
        "baseUrl",
        "model",
        "language",
        "selectedDeviceId",
      ],
      (result) => {
        setApiKey(
          (result.apiKey as string) || import.meta.env.VITE_API_KEY || "",
        );
        setElevenLabsKey(
          (result.elevenLabsKey as string) ||
            import.meta.env.VITE_ELEVENLABS_API_KEY ||
            "",
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
        setSelectedDeviceId((result.selectedDeviceId as string) || "");
      },
    );

    const loadDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(
          (device) => device.kind === "audioinput",
        );
        setAudioDevices(audioInputs);
      } catch (error) {
        console.error("Failed to enumerate devices:", error);
      }
    };
    loadDevices();
  }, []);

  const handleSave = () => {
    chrome.storage.local.set(
      { apiKey, elevenLabsKey, baseUrl, model, language, selectedDeviceId },
      () => {
        i18n.changeLanguage(language);
        onBack();
      },
    );
  };

  return (
    <div className="panel settings-panel">
      <header className="panel-header panel-header--settings">
        <button
          onClick={onBack}
          className="icon-btn"
          type="button"
          aria-label="Back to chat"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="panel-title-block">
          <div className="panel-title-row">
            <h2 style={{ fontSize: "1.25rem", margin: 0 }}>
              {t("settings.title")}
            </h2>
          </div>
        </div>
      </header>

      <div className="panel-body settings-body">
        <section className="settings-section fade-rise">
          <div className="settings-section-title">
            {t("settings.sections.general")}
          </div>
          <div className="settings-row">
            <label htmlFor="language-select" className="field-label">
              {t("settings.labels.language")}
            </label>
            <div className="field-control">
              <select
                id="language-select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="field-select"
              >
                <option value="en">English</option>
                <option value="zh">Chinese (Simplified)</option>
                <option value="fr">French</option>
              </select>
              <ChevronDown size={16} className="field-icon" />
            </div>
          </div>
        </section>

        <section className="settings-section fade-rise">
          <div className="settings-section-title">
            {t("settings.sections.ai")}
          </div>
          <div className="settings-row">
            <label htmlFor="api-key" className="field-label">
              {t("settings.labels.apiKey")}
            </label>
            <div className="field-control field-control--with-action">
              <input
                id="api-key"
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={t("settings.placeholders.apiKey")}
                className="field-input"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="field-action"
                aria-label="Toggle API key visibility"
              >
                {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="settings-row">
            <label htmlFor="base-url" className="field-label">
              {t("settings.labels.baseUrl")}
            </label>
            <div className="field-control">
              <input
                id="base-url"
                type="text"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder={t("settings.placeholders.baseUrl")}
                className="field-input"
              />
            </div>
          </div>

          <div className="settings-row">
            <label htmlFor="model-name" className="field-label">
              {t("settings.labels.model")}
            </label>
            <div className="field-control">
              <input
                id="model-name"
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="gemini-2.0-flash-exp"
                className="field-input"
              />
            </div>
          </div>
        </section>

        <section className="settings-section fade-rise">
          <div className="settings-section-title">
            {t("settings.sections.voice")}
          </div>
          <div className="settings-row">
            <label htmlFor="elevenlabs-key" className="field-label">
              {t("settings.labels.elevenLabsKey")}
            </label>
            <div className="field-control field-control--with-action">
              <input
                id="elevenlabs-key"
                type={showElevenLabsKey ? "text" : "password"}
                value={elevenLabsKey}
                onChange={(e) => setElevenLabsKey(e.target.value)}
                placeholder={t("settings.placeholders.elevenLabsKey")}
                className="field-input"
              />
              <button
                type="button"
                onClick={() => setShowElevenLabsKey(!showElevenLabsKey)}
                className="field-action"
                aria-label="Toggle ElevenLabs key visibility"
              >
                {showElevenLabsKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="settings-row">
            <label htmlFor="microphone-select" className="field-label">
              Microphone
            </label>
            <div className="field-control">
              <select
                id="microphone-select"
                value={selectedDeviceId}
                onChange={(e) => setSelectedDeviceId(e.target.value)}
                className="field-select"
              >
                <option value="">Default</option>
                {audioDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Device ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="field-icon" />
            </div>
          </div>
        </section>

        <button
          onClick={handleSave}
          className="primary-btn save-btn"
          type="button"
        >
          <Save size={18} />
          {t("settings.save")}
        </button>
      </div>
    </div>
  );
};
