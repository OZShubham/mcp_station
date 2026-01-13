# 🚀 MCP Station

<div align="center">
  <img src="assets/thumbnail.png" alt="MCP Station Banner" width="800"/>
  
  <p align="center">
    <strong>A production-ready MCP client with multi-provider LLM support</strong>
  </p>
  
  <p align="center">
    <a href="https://youtu.be/52KGw4Ka8mA?si=QSGe8MBuup20MTlv">
      <img src="https://img.shields.io/badge/▶️_Watch_Demo-FF0000?style=for-the-badge&logo=youtube&logoColor=white" alt="YouTube Demo"/>
    </a>
    <a href="https://github.com/OZShubham/mcp_station.git">
      <img src="https://img.shields.io/github/stars/yourusername/mcp-station?style=for-the-badge" alt="Stars"/>
    </a>
  </p>
</div>

---

## What is this?

**MCP Station is the testing playground every MCP developer wishes they had.**

You build MCP servers. Testing them shouldn't be painful. MCP Station makes it **ridiculously easy**:

✓ Connect any server in 10 seconds (stdio, HTTP, SSE - all supported)  
✓ Chat with AI models that actually use your tools  
✓ See every tool call, argument, and result in real-time  
✓ Test multiple servers working together  
✓ Save every conversation automatically  

**Connect your server → Start chatting → Watch it work → Ship with confidence**

No complex setup. No config files. No BS.

> **🎥 New to MCP Station?** [Watch the 12-minute explainer video](https://youtu.be/52KGw4Ka8mA?si=QSGe8MBuup20MTlv) to see it in action!

---

## Why you should be using MCP Station

### 🚀 **Fastest way to iterate**
Write code → Reconnect (1 click) → Test (10 seconds) → Fix → Repeat  
**Other tools make you wait. MCP Station makes you fast.**

### 👁️ **Actually visual**  
See tool calls happening in real-time. Beautiful syntax highlighting. Proper error messages. Not just terminal dumps.

### 🔒 **Built-in safety**  
AI requests permission before executing anything dangerous. Delete files? Approve first. Call APIs? Your choice. **You're always in control.**

### 🎯 **Multi-server powerhouse**  
Connect GitHub + Database + Filesystem together. Test complex workflows that span multiple servers. **Nobody else does this as cleanly.**

### 🤖 **Two AI models, one interface**  
Switch between Groq (blazing fast) and Gemini (incredibly smart) instantly. See how different models use your tools. **Compare behavior without changing code.**

### 💾 **Zero effort documentation**  
Every conversation saved automatically. Your test cases write themselves. Export examples for your README. **Testing becomes documentation.**

### 🎨 **Gorgeous dark mode**  
Because you're coding at 2 AM and your eyes matter.

**Bottom line: MCP Station is the difference between "testing is painful" and "testing is done."**

---

## Quick Start (seriously, it's 2 minutes)

### Prerequisites
- Python 3.9+
- Node.js 18+
- An API key (Groq or Google AI - both have free tiers)

### Installation

```bash
# 1. Clone this beast
git clone https://github.com/OZShubham/mcp_station.git
cd mcp-station

# 2. Backend setup (30 seconds)
pip install -r requirements.txt

# 3. Configure API keys
cd backend
echo "GROQ_API_KEY=your_key_here" > .env
# OR for Gemini:
echo "GOOGLE_API_KEY=your_key_here" > .env

# 4. Start backend
python app.py

# 5. Frontend setup (30 seconds, in new terminal)
cd frontend
npm install
npm run dev
```

**Open http://localhost:5173 and you're in.**

**Get your free API keys:**
- **Groq:** https://console.groq.com/keys (blazing fast, free tier)
- **Gemini:** https://aistudio.google.com/app/apikey (smart, generous limits)

First time setup? 2 minutes. Every time after? 10 seconds.

---

## See It In Action

### Example 1: Test a Local Server
```
1. Click "Connections" in sidebar
2. Select "Stdio (Local)"
3. Enter: python my_server.py
4. Click "Connect Server"
5. Start chatting

Done. Your tools are live.
```

### Example 2: Multi-Server Magic
```
Connect three servers:
✓ GitHub MCP (remote HTTP)
✓ Filesystem MCP (local stdio)
✓ Database MCP (local stdio)

Chat: "Create a GitHub repo named 'test', add README.md from 
      my Documents folder, then log this action to the database"

Watch MCP Station orchestrate all three servers seamlessly.
```

**This is the power of proper tooling.**

---

## How It Works

### 1. Connect Your MCP Server

**Local Python script:**
```
Type: Stdio
Target: python my_server.py
```

**Remote HTTP server:**
```
Type: HTTP  
Target: https://gitmcp.io/langchain-ai/langchain
```


### 2. Chat Naturally

```
You: "What tools do you have?"
AI: Lists all available tools with descriptions

You: "Use the calculate_hash tool on 'hello world'"
AI: Requests permission → You approve → Shows result
```

### 3. See Everything

- Tool name and arguments (formatted JSON)
- Execution status (running/completed/error)
- Output or errors (with syntax highlighting)
- Timing information (performance metrics)

### 4. Iterate Quickly

Found an issue? Fix your server code, click reconnect, test again. **Takes 10 seconds.**

---

## Powerful Features That Just Work

### 🔗 **Universal Connection Support**
Stdio servers? Check. HTTP endpoints? Check. SSE legacy? Check.  
**If it speaks MCP, MCP Station connects to it.**

### 🎭 **Dual-Mode Interface**
- **Chat Mode**: Natural conversation testing with AI
- **Debug Mode**: Low-level tool inspection and JSON editing

**Best of both worlds. Switch anytime.**

### 📊 **Production-Grade Logging**
Structured JSON logs. Request/response tracking. Performance timing. Error traces.  
Located in `backend/logs/` - always there when you need them.

**Professional logging without the enterprise price tag.**

### ⚡ **Hot Reload Everything**
Changed your server code? Just reconnect. All your conversations stay intact.  
**No restart. No data loss. Just keep testing.**

### 🎨 **Polished UI That Developers Love**
- Markdown rendering with code highlighting
- Streaming responses (see AI think in real-time)
- Mobile responsive (test from anywhere)
- Keyboard shortcuts for power users
- Theme that doesn't hurt your eyes

**Looks like a product, not a prototype.**

---

## Usage Examples

### Test a New Tool
```python
# my_server.py
from mcp.server.fastmcp import FastMCP

mcp = FastMCP("My Server")

@mcp.tool()
def greet(name: str) -> str:
    """Greet someone by name"""
    return f"Hello, {name}!"

if __name__ == "__main__":
    mcp.run(transport="stdio")
```

**Test it:**
1. Connect: `python my_server.py`
2. Chat: "Greet me as John"
3. Approve the tool call
4. See result instantly
5. Improve → Reconnect → Test again

### Multi-Server Workflow
```
Connect: 
- GitHub MCP (create repos)
- Filesystem MCP (read files)
- Database MCP (log actions)

Chat: "Create a repo called 'test-project', add the README 
       from my Documents folder, and log this action"

Watch all three tools work together seamlessly
```

### Debug Production Issues
```
1. Connect to your staging MCP server
2. Reproduce the exact conversation that failed
3. See where it breaks (with full error traces)
4. Fix the issue in your code
5. Reconnect and verify the fix
```

---

## Complete Tech Stack

### Backend Powerhouse
- **FastAPI** - Async Python, production-ready
- **Official MCP Python SDK** - Protocol compliance guaranteed
- **SQLite with WAL mode** - Fast, reliable, zero-config
- **Groq + Google GenAI SDKs** - Best-in-class LLM integration
- **Structured logging** - Debug without suffering

### Frontend Excellence
- **React 19 + TypeScript** - Modern, type-safe
- **Zustand** - State management without boilerplate
- **Tailwind CSS 4** - Beautiful by default
- **React Markdown + Syntax Highlighter** - Proper rendering
- **Vite** - Instant hot reload

**Everything you need. Nothing you don't.**

---

## Included Example Server

`backend/tools_server.py` comes with real tools you can learn from:

**🔐 Cryptographically Secure Password Generator**  
Generates truly random passwords using Python's `secrets` module. Shows how to build tools LLMs can't replicate.

**🔒 Multi-Algorithm Hash Calculator**  
SHA256, MD5, SHA512 support. Demonstrates parameter validation and error handling.

**🆔 UUID Generator**  
RFC 4122 compliant identifiers. Example of stateless tool design.

**📅 Date Calculator**  
Timezone-aware date arithmetic. Shows how to return structured data.

**Start it now:**
```bash
cd backend
python tools_server.py
```

Then connect in MCP Station:
```
Type: Stdio
Target: python backend/tools_server.py
```

**Not toy examples. Real, production-ready code you can actually use.**

---

## Common Issues & Solutions

### Server Won't Connect?
```bash
# Check the path/URL is correct
python /full/path/to/server.py  # Use absolute paths

# Verify Python/Node is installed
python --version
node --version

# Look at backend console output for errors
# Check backend/logs/errors.log
```

### AI Not Using Tools?
- Tool description might be unclear (add more details)
- Try simpler requests first ("What tools do you have?")
- Test in Debug mode to see raw tool schemas
- Check the tool is actually connected (look for green indicator)

### Slow Responses?
- Switch to Groq (faster inference)
- Check API key has credits remaining
- Verify internet connection
- Look for rate limiting in logs

### Frontend Won't Start?
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Other Issues?
1. Check `backend/logs/errors.log` for detailed traces
2. Search [GitHub Issues](https://github.com/OZShubham/mcp_station.git/issues)
3. Open a new issue with:
   - Your OS and versions
   - Steps to reproduce
   - Error messages from logs

---

## Roadmap (Actually Happening)

### Coming Very Soon
- [ ] **Test Suite Automation** - Save conversations as repeatable tests
- [ ] **Export/Import Configs** - Share server setups with your team instantly
- [ ] **Tool Analytics Dashboard** - Usage stats, performance metrics, error rates
- [ ] **CI/CD Integration** - Run MCP tests in GitHub Actions
- [ ] **Team Workspaces** - Collaborate on testing scenarios

### Future Plans
- [ ] Plugin system for custom extensions
- [ ] Cloud deployment option (keep your local setup)
- [ ] Advanced tool monitoring and alerting
- [ ] Community tool marketplace
- [ ] Multi-language support (i18n)

**Want something else? Tell me.** Open an issue or discussion - I respond quickly and prioritize community feedback.

---

## Why I Built This

**The honest story:**

While building MCP servers, testing was painful. Really painful.

- Deploy to Claude Desktop? Slow and clunky.
- Write unit tests? Missing the real AI interaction.
- Use command line? Can't see what's happening.
- Existing tools? Either too basic or too complex.

So I built what I wanted: **A visual playground where you chat naturally and see everything in real-time.**

Turns out other developers wanted it too.

**MCP Station exists because testing should help you ship, not slow you down.**

---

## Contributing (I Want Your Help)

**Found a bug?** → [GitHub Issues](https://github.com/OZShubham/mcp_station.git/issues)  
**Have an idea?** → [GitHub Discussions](https://github.com/OZShubham/mcp_station.git/discussions)  
**Want to code?** → Submit PRs (I review quickly)  
**Improved docs?** → Every bit helps  
**Built something cool?** → Show me!

### Quick Contribution Guide
```bash
# 1. Fork the repo
# 2. Clone your fork
git clone https://github.com/OZShubham/mcp_station.git

# 3. Create a branch
git checkout -b feature/amazing-feature

# 4. Make your changes
# 5. Test thoroughly
# 6. Commit with clear message
git commit -m "Add amazing feature that does X"

# 7. Push and open PR
git push origin feature/amazing-feature
```

**This project gets better when developers like you contribute.**

---

## System Requirements

**Minimum:**
- Python 3.9+ (newer = faster)
- Node.js 18+ (LTS recommended)
- 2GB RAM
- Any modern browser

**Recommended:**
- Python 3.11+
- Node.js 20+
- 4GB RAM
- Chrome/Edge (best DevTools)

**API Keys (pick one or both):**
- **Groq** - Free tier, blazing fast (https://console.groq.com)
- **Google AI Studio** - Free, generous limits (https://aistudio.google.com)
- **Vertex AI** - Enterprise option (requires GCP account)

**That's literally it. No Docker, no Kubernetes, no cloud accounts required.**

---

## Project Structure

```
mcp-station/
├── assets/              # Images and media
│   └── thumbnail.png    
├── backend/             # FastAPI server
│   ├── app.py          # Main application + MCP orchestration
│   ├── database.py     # SQLite chat persistence
│   ├── logger.py       # Structured logging system
│   ├── tools_server.py # Example FastMCP server
│   └── logs/           # Auto-generated logs
├── frontend/            # React + TypeScript
│   ├── src/
│   │   ├── components/ # UI components
│   │   ├── store/      # Zustand state management
│   │   └── containers/ # Container components
│   └── vite.config.ts
└── requirements.txt     # Python dependencies
```

---

## License & Credits

**MIT License** - Use it commercially. Modify it. Ship it. Just keep the license file.

**Built with ❤️ by [Shubham Mishra](https://github.com/OZShubham)** with late nights and lots of coffee ☕

**Special thanks to:**
- **Anthropic** - MCP Protocol specification
- **Groq** - Ultra-fast inference infrastructure
- **Google** - Gemini API and continued innovation
- **FastMCP community** - Simplified server creation
- **All contributors** - You make this project better

---

## Support This Project

**If MCP Station saves you time:**

⭐ **[Star the repo](https://github.com/OZShubham/mcp_station.git)** - Helps others discover it  
🐦 **Share on Twitter/X** - Spread the word  
📺 **Share the [YouTube video](https://youtu.be/52KGw4Ka8mA?si=QSGe8MBuup20MTlv)** - Help others learn  
🐛 **Report bugs** - Makes it better for everyone  
💻 **Contribute code** - Join the builders  
📝 **Write about it** - Blog posts, tweets, anything!  

**Every GitHub star motivates me to build more. Don't be shy.**

---

## Get Help

### Something Broke?
1. Check `backend/logs/errors.log` for detailed traces
2. Search [GitHub Issues](https://github.com/OZShubham/mcp_station.git/issues)
3. Open a new issue with:
   - OS and version info
   - Steps to reproduce
   - Error messages/logs
   - Screenshots if relevant

### Have Questions?
1. Read this README thoroughly (seriously, it's comprehensive)
2. Check [GitHub Discussions](https://github.com/OZShubham/mcp_station.git/discussions)
3. Watch the [video tutorial](https://youtu.be/52KGw4Ka8mA?si=QSGe8MBuup20MTlv)
4. Ask in the MCP Discord community

### Want to Chat?
- **Email:** smdell83@gmail.com
- **GitHub Discussions:** (preferred for community benefit)

**Response time: Usually within 24-48 hours. I'm active and responsive!**

---

## Security

### Reporting Vulnerabilities
Found a security issue? **Please don't open a public issue.**

Email: smdell83@gmail.com with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if you have one)

I'll respond within 48 hours and work with you on a fix.

### Security Features
- ✅ Tool approval before execution (manual confirmation)
- ✅ Input sanitization and validation
- ✅ Environment-based secrets (never committed)
- ✅ No telemetry or tracking
- ✅ All data stays local (your machine only)

---

## FAQ

**Q: Do I need both Groq and Gemini API keys?**  
A: No, just one. Groq is faster, Gemini is smarter. Pick what works for you.

**Q: Does this work with Claude Desktop?**  
A: MCP Station is a standalone client. It doesn't integrate with Claude Desktop, but you can test servers that work with both.

**Q: Can I use this in production?**  
A: MCP Station is for testing and development. For production AI applications, integrate MCP directly into your app.

**Q: Is my data sent to any servers?**  
A: Only to the LLM providers (Groq/Google) for AI responses. Everything else stays local. No telemetry, no tracking.

**Q: Can I use other LLM providers?**  
A: Currently Groq and Gemini. OpenAI support is on the roadmap. PRs welcome!

**Q: Does this cost money?**  
A: MCP Station is free and open source. You only pay for LLM API usage (both have generous free tiers).

---

## Final Words

**MCP Station is built for developers who value their time.**

No fluff. No complexity. No subscription. No tracking.

Just a solid tool that helps you test MCP servers properly.

**If you're tired of painful testing workflows, give it 5 minutes.**

I think you'll like it.

---

## Ready to Ship Better MCP Tools?

```bash
# Clone it
git clone https://github.com/OZShubham/mcp_station.git
cd mcp-station

# Set it up
pip install -r requirements.txt
cd backend
echo "GROQ_API_KEY=your_key" > .env
python app.py

# In another terminal
cd frontend
npm install
npm run dev

# Open http://localhost:5173
```

**Now go build something amazing.** 🚀

---

<div align="center">

**Made with ❤️ by developers, for developers**

[![Watch Demo](https://img.shields.io/badge/▶️_Watch-Demo-red?style=for-the-badge&logo=youtube)](https://youtu.be/52KGw4Ka8mA?si=QSGe8MBuup20MTlv)
[![GitHub Stars](https://img.shields.io/github/stars/yourusername/mcp-station?style=for-the-badge)](https://github.com/OZShubham/mcp_station.git)
[![Fork on GitHub](https://img.shields.io/github/forks/yourusername/mcp-station?style=for-the-badge)](https://github.com/OZShubham/mcp_station.git/fork)
[![License](https://img.shields.io/badge/license-MIT-blue.svg?style=for-the-badge)](LICENSE)

**[⭐ Star on GitHub](https://github.com/OZShubham/mcp_station.git)** • **[📺 Watch Tutorial](https://youtu.be/52KGw4Ka8mA?si=QSGe8MBuup20MTlv)** • **[💬 Join Discussion](https://github.com/OZShubham/mcp_station.git/discussions)**

</div>