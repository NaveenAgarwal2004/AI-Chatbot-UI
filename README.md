# AI Chat Interface - Professional AI Platform

A comprehensive, production-ready AI chat interface that combines the best features from leading AI platforms with extensive customization, multi-provider support, and enterprise-grade functionality.

![AI Chat Interface](https://via.placeholder.com/800x400/6366f1/ffffff?text=AI+Chat+Interface)

## ✨ Features

### 🤖 Multi-Provider AI Support
- **OpenAI**: GPT-4 Turbo, GPT-4, GPT-3.5 Turbo
- **Anthropic**: Claude 3 Opus, Sonnet, Haiku
- **Google**: Gemini Pro, Gemini Pro Vision
- **HuggingFace**: Free open-source models
- **Cohere**: Command models
- **Groq**: Fast inference with Mixtral, Llama 2
- **Ollama**: Local model execution
- **Free Options**: Multiple providers with generous free tiers

### 💬 Advanced Chat Features
- **Conversation Management**: Create, save, and organize multiple conversations
- **Message Operations**: Edit, delete, copy, and regenerate messages
- **Real-time Streaming**: Live response generation (where supported)
- **Conversation Export**: JSON, Markdown, and Text formats
- **Search & Filter**: Find conversations and messages quickly
- **Auto-save**: Automatic conversation persistence

### 📁 File Processing
- **Multi-format Support**: Text, images, code, documents, CSV, JSON
- **Drag & Drop Interface**: Intuitive file upload experience
- **File Analysis**: Automatic content extraction and analysis
- **Preview System**: Quick file content preview
- **Batch Processing**: Handle multiple files simultaneously

### ⚙️ Customizable Parameters
- **Temperature Control**: Adjust creativity and randomness
- **Token Limits**: Configure maximum response length
- **Advanced Settings**: Top-P, presence penalty, frequency penalty
- **Model-specific Options**: Tailored controls for each provider
- **Preset Management**: Save and load parameter configurations

### 📚 Template System
- **Rich Template Library**: Pre-built prompts for common tasks
- **Custom Templates**: Create and organize your own prompts
- **Categories**: Organize templates by use case
- **Usage Tracking**: Monitor template popularity and effectiveness
- **Import/Export**: Share templates with your team

### 🎨 Modern Interface
- **Dark/Light Themes**: Seamless theme switching
- **Responsive Design**: Perfect on desktop, tablet, and mobile
- **Accessibility**: WCAG compliant interface
- **Smooth Animations**: Polished user experience
- **Professional Styling**: Modern gradient-based design system

### 🔧 Developer Features
- **TypeScript**: Full type safety and excellent DX
- **Component Library**: Reusable shadcn/ui components
- **Service Architecture**: Clean separation of concerns
- **Error Handling**: Comprehensive error management
- **Performance Optimized**: Lazy loading and efficient rendering

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- API keys for your chosen AI providers (optional for demo)

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd ai-chat-interface

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
```

### Environment Configuration

Edit `.env` file with your API keys:

```env
# AI API Configuration (add your keys)
VITE_OPENAI_API_KEY=your_openai_api_key_here
VITE_ANTHROPIC_API_KEY=your_anthropic_api_key_here
VITE_GOOGLE_API_KEY=your_google_api_key_here
VITE_HUGGINGFACE_API_KEY=your_huggingface_api_key_here
VITE_COHERE_API_KEY=your_cohere_api_key_here
VITE_GROQ_API_KEY=your_groq_api_key_here

# Feature toggles
VITE_ENABLE_REAL_API=true
VITE_ENABLE_LOCAL_STORAGE=true
VITE_ENABLE_FILE_UPLOAD=true

# Application settings
VITE_APP_NAME=AI Chat Interface
VITE_MAX_CONVERSATION_LENGTH=100
VITE_AUTO_SAVE_INTERVAL=30000
```

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔑 API Setup

### Free Options (No Credit Card Required)

1. **HuggingFace** (Free tier available)
   - Sign up at [huggingface.co](https://huggingface.co)
   - Get free API access for inference

2. **Ollama** (Completely free, runs locally)
   - Install from [ollama.ai](https://ollama.ai)
   - Run models locally: `ollama run llama2`

3. **Groq** (Free tier with fast inference)
   - Sign up at [groq.com](https://groq.com)
   - Get free credits for fast model inference

### Paid Options (With Free Tiers)

4. **OpenAI**
   - Create account at [platform.openai.com](https://platform.openai.com)
   - $5 free credit for new accounts

5. **Anthropic Claude**
   - Sign up at [console.anthropic.com](https://console.anthropic.com)
   - Free usage tier available

6. **Google Gemini**
   - Get API key from [makersuite.google.com](https://makersuite.google.com)
   - Generous free tier

## 📖 Usage

### Basic Chat
1. Select an AI model from the dropdown
2. Adjust parameters if needed
3. Type your message and press Enter
4. View AI response with token usage info

### File Upload
1. Click the paperclip icon or drag files into the chat
2. Supported formats: text, code, images, documents, CSV, JSON
3. Ask questions about your uploaded files
4. AI will analyze and respond with insights

### Templates
1. Access the template library in the left sidebar
2. Browse categories or create custom templates
3. Click to load a template into the chat
4. Modify placeholders and send

### Conversation Management
1. Conversations auto-save as you chat
2. Access conversation history in the sidebar
3. Search conversations using the search bar
4. Export conversations in multiple formats

### Advanced Features
1. **Regenerate**: Click the regenerate button for alternative responses
2. **Edit Messages**: Edit your messages after sending
3. **Copy/Export**: Copy individual messages or export entire conversations
4. **Parameters**: Fine-tune AI behavior with advanced settings

## 🏗️ Architecture

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── AIInterface.tsx # Main interface
│   ├── ChatArea.tsx    # Chat interface
│   ├── ChatBubble.tsx  # Message display
│   └── ...
├── contexts/           # React contexts
│   ├── AIContext.tsx   # AI state management
│   └── ThemeContext.tsx# Theme management
├── services/           # Business logic
│   ├── aiService.ts    # AI API integration
│   ├── storageService.ts # Data persistence
│   └── fileService.ts  # File processing
├── hooks/              # Custom React hooks
└── lib/                # Utilities
```

## 🔧 Configuration

### Model Configuration
Add new AI providers by extending the models array in `AIContext.tsx`:

```typescript
{
  id: 'new-model',
  name: 'New Model',
  provider: 'Provider Name',
  description: 'Model description',
  category: 'text',
  contextLength: 4096,
  pricing: { input: 0.001, output: 0.002 }
}
```

### Custom Templates
Create custom prompt templates:

```typescript
{
  id: 'custom-template',
  name: 'My Custom Template',
  content: 'Your prompt template with {PLACEHOLDERS}',
  category: 'Custom',
  tags: ['custom', 'specific-use']
}
```

### Styling
The interface uses CSS variables for theming. Customize in `src/index.css`:

```css
:root {
  --primary: your-primary-color;
  --background: your-background-color;
  /* ... other variables */
}
```

## 🚢 Deployment

### Vercel (Recommended)
```bash
npm run build
# Deploy build folder to Vercel
```

### Netlify
```bash
npm run build
# Deploy dist folder to Netlify
```

### Self-hosted
```bash
npm run build
# Serve dist folder with your web server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed

## 🔒 Security & Privacy

- **Local Storage**: All data stored locally in your browser
- **API Keys**: Stored locally, never sent to third parties
- **No Tracking**: No analytics or user tracking
- **Open Source**: Full transparency in code

## 📊 Performance

- **Lazy Loading**: Components loaded on demand
- **Optimized Rendering**: Efficient React patterns
- **Caching**: Smart caching for better performance
- **Minimal Bundle**: Tree-shaking and code splitting

## 🔧 Troubleshooting

### Common Issues

**API Key Not Working**
- Verify API key is correct
- Check if API key has required permissions
- Ensure billing is set up (for paid services)

**File Upload Failing**
- Check file size (max 10MB)
- Verify file type is supported
- Ensure `VITE_ENABLE_FILE_UPLOAD=true`

**Conversations Not Saving**
- Verify `VITE_ENABLE_LOCAL_STORAGE=true`
- Check browser local storage permissions
- Clear browser cache if issues persist

## 📈 Roadmap

- [ ] **Voice Input/Output**: Speech-to-text and text-to-speech
- [ ] **Plugin System**: Extensible plugin architecture  
- [ ] **Team Collaboration**: Share conversations and templates
- [ ] **Advanced Analytics**: Usage statistics and insights
- [ ] **Custom Models**: Support for fine-tuned models
- [ ] **API Rate Limiting**: Built-in rate limit handling
- [ ] **Offline Mode**: Continue working without internet
- [ ] **Mobile App**: Native mobile applications

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com) for the beautiful UI components
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS
- [Lucide](https://lucide.dev) for the icon set
- [Radix UI](https://radix-ui.com) for accessible primitives

## 🆘 Support

- 📧 Email: support@your-domain.com
- 💬 Discord: [Join our community]()
- 📖 Documentation: [View docs]()
- 🐛 Issues: [GitHub Issues]()

---

**Built with ❤️ for the AI community**

*Professional AI chat interface that brings enterprise-grade features to everyone.*