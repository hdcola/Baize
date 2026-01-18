// ElevenLabs API service
const DEFAULT_VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // Rachel voice

export interface TTSOptions {
    text: string;
    voiceId?: string;
    modelId?: string;
}

export interface STTOptions {
    audioBlob: Blob;
    mimeType: string;
    languageCode?: string;
}

export const elevenLabsService = {
    // Get API key from storage or fallback to env
    async getApiKey(): Promise<string> {
        return new Promise((resolve) => {
            if (typeof chrome !== "undefined" && chrome.storage) {
                chrome.storage.local.get(["elevenLabsKey"], (result) => {
                    const key = (result.elevenLabsKey as string) || import.meta.env.VITE_ELEVENLABS_API_KEY;
                    resolve(key || "");
                });
            } else {
                resolve(import.meta.env.VITE_ELEVENLABS_API_KEY || "");
            }
        });
    },

    // Text to Speech
    async textToSpeech(options: TTSOptions): Promise<Blob> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            throw new Error("Missing ElevenLabs API Key. Please configure it in Settings.");
        }

        const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${options.voiceId || DEFAULT_VOICE_ID}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "xi-api-key": apiKey,
                },
                body: JSON.stringify({
                    text: options.text,
                    model_id: options.modelId || "eleven_multilingual_v2",
                    voice_settings: {
                        stability: 0.5,
                        similarity_boost: 0.75,
                    },
                }),
            },
        );

        if (!response.ok) {
            throw new Error(`TTS API error: ${response.status}`);
        }

        return await response.blob();
    },

    // Speech to Text
    async speechToText(options: STTOptions): Promise<string> {
        const apiKey = await this.getApiKey();
        if (!apiKey) {
            throw new Error("Missing ElevenLabs API Key. Please configure it in Settings.");
        }

        const fileExtension = options.mimeType.includes("ogg")
            ? "ogg"
            : options.mimeType.includes("mp4")
              ? "mp4"
              : "webm";

        const formData = new FormData();
        formData.append(
            "file",
            options.audioBlob,
            `recording.${fileExtension}`,
        );
        formData.append("model_id", "scribe_v2");
        if (options.languageCode) {
            formData.append("language_code", options.languageCode);
        }

        const response = await fetch(
            "https://api.elevenlabs.io/v1/speech-to-text",
            {
                method: "POST",
                headers: {
                    "xi-api-key": apiKey,
                },
                body: formData,
            },
        );

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`STT API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        return result.text || "";
    },

    // Play audio blob
    async playAudio(audioBlob: Blob): Promise<void> {
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        return new Promise((resolve, reject) => {
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            audio.onerror = (error) => {
                URL.revokeObjectURL(audioUrl);
                reject(error);
            };
            audio.play().catch(reject);
        });
    },
};
