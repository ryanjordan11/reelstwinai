<img width="1213" height="802" alt="Screenshot 2026-08-14 at 5 57 42 PM" src="https://github.com/user-attachments/assets/0cc05cb1-a94f-467b-8993-a7656adc9480" />

# Reels Creator

Create stunning reels with **Veo**, custom AI models, API gateways, and personal avatar studio.

> *Made by Ryan Jordan, inspired by Seth Anderson*

---

## 🎬 Overview

**Reels Creator** is an open-source web application that empowers creators to generate professional short-form video content using cutting-edge AI technology. Powered by Google's Veo AI model and the Gemini API, this tool provides an intuitive interface for creating, customizing, and exporting video reels.

### Key Features

- 🎥 **AI-Powered Video Generation** - Generate videos using Google's Veo AI model
- 👤 **Custom Avatar Studio** - Create and customize personal avatars for your content
- 🎨 **Advanced Editing Tools** - Fine-tune your reels with professional editing capabilities
- 🔌 **API Gateway Integration** - Seamless integration with custom AI models and external APIs
- ⚡ **Real-time Preview** - See changes instantly as you work
- 📦 **Export & Share** - Download your creations in multiple formats
- 🎯 **User-Friendly Interface** - Intuitive design built with React and modern web technologies




<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 40 PM" src="https://github.com/user-attachments/assets/93eccab5-b408-4c82-86a3-f41b8964e74e" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 37 PM" src="https://github.com/user-attachments/assets/c0cba3b2-5c26-4269-9ca5-7574f88fb104" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 35 PM" src="https://github.com/user-attachments/assets/a7011280-e101-4822-8040-beb497243dd1" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 32 PM" src="https://github.com/user-attachments/assets/b53291a7-3fd2-42e5-ab7c-2fd656d4bf8e" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 29 PM" src="https://github.com/user-attachments/assets/1dfecd93-205b-4ae4-af64-3f6a88e0203c" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 26 PM" src="https://github.com/user-attachments/assets/9728ce90-0f2a-4354-b3a2-e2ff2c942357" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 23 PM" src="https://github.com/user-attachments/assets/0a354257-1568-41ad-978b-a sawf8bfb6" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 19 PM" src="https://github.com/user-attachments/assets/b06c38f8-10c6-4301-8132-02138fde4e12" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 17 PM" src="https://github.com/user-attachments/assets/a4289ad4-329e-455d-9369-cf2b84d556eb" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 13 PM" src="https://github.com/user-attachments/assets/59395ea5-c6b8-45d3-a997-7254778988df" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 09 PM" src="https://github.com/user-attachments/assets/14f244d5-9c0b-43ed-a90b-3347760124d1" />
<img width="1512" height="982" alt="Screenshot 2026-08-14 at 6 07 01 PM" src="https://github.com/user-attachments/assets/06cdbfba-18ee-4614-a096-5aea66f743b1" />

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **bun** package manager
- **Google Gemini API Key** (get one at [Google AI Studio](https://aistudio.google.com))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ryanjordan11/reelstwinai.git
   cd reelstwinai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or if using bun
   bun install
   ```

3. **Set up environment variables**
   ```bash
   # Create a .env file in the root directory
   # Add your Google Gemini API key
   VITE_GOOGLE_GENAI_KEY=your_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   bun run dev
   ```

   The application will be available at `http://localhost:5173`

---

## 📦 Build & Deploy

### Build for Production

```bash
npm run build
# or
bun run build
```

This generates an optimized production build in the `dist/` directory.

### Preview Build Locally

```bash
npm run preview
# or
bun run preview
```

### Type Checking

```bash
npm run lint
# or
bun run lint
```

---

## 🏗️ Project Structure

```
reelstwinai/
├── App.tsx              # Main application component
├── index.tsx            # Application entry point
├── types.ts             # TypeScript type definitions
├── metadata.json        # Project metadata
├── components/          # Reusable React components
├── services/            # API and business logic services
├── index.css            # Global styles
├── package.json         # Project dependencies
├── vite.config.ts       # Vite configuration
├── tsconfig.json        # TypeScript configuration
└── index.html           # HTML template
```

---

## 💻 Tech Stack

### Frontend
- **React** (19.2.0) - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Framer Motion** - Animation library
- **Lucide React** - Icon library
- **Motion** - Additional animation utilities

### APIs & Services
- **Google Gemini API** - AI model integration
- **Veo AI** - Video generation model

### Build & Development
- **Vite** - Next-generation frontend tooling
- **TypeScript** - Language and tooling
- **JSZip** - ZIP file handling (for exports)

---

## 🎯 Usage

1. **Launch the Application** - Start the dev server and navigate to the local URL
2. **Create a New Project** - Click "New Project" to start creating
3. **Generate Content** - Use AI to generate video scripts or video content
4. **Customize** - Edit avatars, effects, and timing to match your vision
5. **Export** - Download your finished reel in your preferred format

---

## 🔧 Configuration

### Vite Configuration
The project uses Vite for fast development and optimized builds. Configuration is in `vite.config.ts`.

### TypeScript Configuration
TypeScript settings are defined in `tsconfig.json` with React and modern JavaScript support.

---

## 📝 License

This project is open source and available under the MIT License. See the LICENSE file for more details.

---

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

Please ensure your code follows the project's style guidelines and includes appropriate tests.

---

## 🐛 Issues & Bug Reports

Found a bug? Have a feature request? Please [open an issue](https://github.com/ryanjordan11/reelstwinai/issues) on GitHub.

---

## 📚 Documentation

For more detailed documentation, tutorials, and API reference, please refer to:
- [Google Gemini API Docs](https://ai.google.dev/docs)
- [React Documentation](https://react.dev)
- [Vite Guide](https://vitejs.dev/guide/)

---

## 🙏 Acknowledgments

- Inspired by Seth Anderson
- Built with React and TypeScript
- Powered by Google's Veo and Gemini APIs
- Community contributions and feedback

---

## 📞 Contact & Support

For questions, feedback, or support, feel free to:
- Open an issue on GitHub
- Check existing documentation
- Review the project's discussion forum

---

## 🌟 Show Your Support

If you find this project helpful, please consider:
- ⭐ Starring the repository
- 🐦 Sharing on social media
- 💬 Providing feedback and suggestions
- 🤝 Contributing to the project

---

**Made with ❤️ by Ryan Jordan**

*Last Updated: August 15, 2026*
