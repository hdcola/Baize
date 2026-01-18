# MatePI

MatePI is a powerful AI-powered browser assistant designed to be a calm command center for your web browsing experience. It integrates seamlessly into your browser's side panel, offering capabilities like page summarization, actionable insight extraction, and direct browser interaction.

## Features ✨

- **Intelligent Browser Agent**: capable of reading page content, clicking elements, and inputting text to automate your workflows.
- **Multi-Model Support**: Integrated with Google Gemini and OpenAI GPT models for flexible AI power.
- **Voice & Speech**:
  - **Speech-to-Text**: Voice control your browser using ElevenLabs' powerful transcription.
  - **Text-to-Speech**: Listen to AI responses with high-quality audio playback.
- **Context Aware**: Instantly summarize the current page, turn articles into study notes, or draft replies based on visible content.
- **Attachment Support**: Drag and drop images to analyze visual content alongside your queries.
- **Internationalization (i18n)**: 🌐 Seamlessly switch between English, Chinese (Simplified), and French with real-time UI updates.
- **Customizable**: Configure API keys, base URLs, models, and preferred languages in the settings.

## Tech Stack 🛠️

MatePI is built with a modern web extension architecture:

- **Framework**: [WXT](https://wxt.dev/) - Next-generation web extension development framework.
- **UI Library**: [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) - Type-safe, component-based UI.
- **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/docs) - Unified interface for connecting with LLMs.
- **Styling**: Vanilla CSS with a focus on modern, semantic design tokens and smooth animations.
- **Icons**: [Lucide React](https://lucide.dev/) - Beautiful, consistent icons.
- **Internationalization**: [i18next](https://www.i18next.com/) + [react-i18next](https://react.i18next.com/) - Robust i18n framework.
- **Markdown**: `react-markdown` for rendering rich text responses.

## Getting Started

1.  **Installation**:

    ```bash
    pnpm install
    ```

2.  **Development**:
    Start the dev server with hot reload:

    ```bash
    pnpm dev
    ```

    This will open a Chrome instance with the extension loaded.

3.  **Build**:
    Build for production:
    ```bash
    pnpm build
    ```

## Configuration

Open the extension settings (gear icon) to configure:

- **API Key**: Your Google Gemini or OpenAI API key.
- **ElevenLabs Key**: Optional, for voice features.
- **Model**: Choose your preferred model (e.g., `gemini-2.0-flash-exp`).
- **Language**: Switch between English, Chinese (Simplified), and French. The interface and AI responses will adapt instantly.

---

_MatePI - Your calm command center for the web._
