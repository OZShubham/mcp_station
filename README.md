# MCP Station

**The most developer-friendly way to test MCP servers. Chat with AI using your tools. See everything. Break nothing.**

[![GitHub Stars](https://img.shields.io/github/stars/yourusername/mcp-station?style=social)](https://github.com/yourusername/mcp-station)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

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

---

## Reason you should be using MCP Stations

### 🚀 **Fastest way to iterate**
Write code → Reconnect (1 click) → Test (10 seconds) → Fix → Repeat  
**Other tools make you wait. MCP Station make you fast.**

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

## Quick start (seriously, it's 2 minutes)

```bash
# Clone this beast
git clone https://github.com/yourusername/mcp-station.git
cd mcp-station

# Backend setup (30 seconds)
pip install -r requirements.txt
cd backend
echo "GROQ_API_KEY=your_key_here" > .env
python app.py

# Frontend setup (30 seconds, new terminal)
cd frontend
npm install
npm run dev
```

**Open http://localhost:5173 and you're in.**

First time setup? 2 minutes. Every time after? 10 seconds.

---

## See it in action

### Example 1: Test a local server
```
1. Click "Connections" 
2. Select "Stdio (Local)"
3. Enter: python my_server.py
4. Click "Connect Server"
5. Start chatting

Done. Your tools are live.
```

### Example 2: Multi-server magic
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

## How it works

### 1. Connect your MCP server

**Local Python script:**
```
Type: Stdio
Target: python my_server.py
```

**Remote HTTP server:**
```
Type: HTTP  
Target: https://gitmcp.io/repo-name
```

**Node package:**
```
Type: Stdio
Target: npx @package/mcp-server
```

### 2. Chat naturally

```
You: "What tools do you have?"
AI: Lists all available tools

You: "Use the calculate_hash tool on 'hello world'"
AI: Requests permission → You approve → Shows result
```

### 3. See everything

- Tool name and arguments
- Execution status
- Output or errors
- Timing information

### 4. Iterate quickly

Found an issue? Fix your server code, reconnect, test again. Takes 10 seconds.

---

## Powerful features that just work

### 🔗 **Universal connection support**
Stdio servers? Check. HTTP endpoints? Check. SSE legacy? MCP Station got you.  
**If it speaks MCP, it connect to it.**

### 🎭 **Dual-mode interface**
- **Chat Mode**: Natural conversation testing with AI
- **Debug Mode**: Low-level tool inspection and JSON editing

**Best of both worlds. Switch anytime.**

### 📊 **Production-grade logging**
Structured JSON logs. Request/response tracking. Performance timing. Error traces.  
Located in `backend/logs/` - always there when you need them.

**Professional logging without the enterprise price tag.**

### ⚡ **Hot reload everything**
Changed your server code? Just reconnect. All your conversations stay intact.  
**No restart. No data loss. Just keep testing.**

### 🎨 **Polished UI that developers love**
- Markdown rendering with code highlighting
- Streaming responses (see AI think in real-time)
- Mobile responsive (test from anywhere)
- Keyboard shortcuts for power users
- Theme that doesn't hurt your eyes

**Looks like a product, not a prototype.**

---

## Example usage

### Test a new tool
```python
# my_server.py
@mcp.tool()
def greet(name: str) -> str:
    return f"Hello, {name}!"
```

Connect it → Chat: "Greet me" → See the result → Improve → Test again

### Multi-server workflow
```
Connect: 
- GitHub MCP
- Filesystem MCP  
- Database MCP

Chat: "Create a repo, add this file, log the action"

Watch all three tools work together
```

### Debug production issues
```
Connect to staging server
Reproduce the exact conversation that failed
See where it breaks
Fix and verify
```

---



**Built by developer, for developers. No marketing BS.**

---

## Complete tech stack

**Backend powerhouse:**
- FastAPI (async Python, production-ready)
- Official MCP Python SDK (protocol compliance guaranteed)
- SQLite with WAL mode (fast, reliable, zero-config)
- Groq + Google GenAI SDKs (best-in-class LLM integration)
- Structured logging (debug without suffering)

**Frontend excellence:**
- React 19 + TypeScript (modern, type-safe)
- Zustand (state management without boilerplate)
- Tailwind CSS 4 (beautiful by default)
- React Markdown + Syntax Highlighter (proper rendering)
- Vite (instant hot reload)

**Everything you need. Nothing you don't.**

---

## Included example server

`backend/tools_server.py` comes with real tools you can learn from:

**Cryptographically secure password generator**  
Generates truly random passwords using Python's `secrets` module. Shows how to build tools LLMs can't replicate.

**Multi-algorithm hash calculator**  
SHA256, MD5, SHA512 support. Demonstrates parameter validation and error handling.

**UUID generator**  
RFC 4122 compliant identifiers. Example of stateless tool design.

**Date calculator**  
Timezone-aware date arithmetic. Shows how to return structured data.

**Not toy examples. Real, production-ready code you can actually use.**

---

## Common issues

**Server won't connect?**
- Check the path/URL is correct
- Verify Python/Node is installed
- Look at backend console output

**AI not using tools?**  
- Tool description might be unclear
- Try simpler requests
- Test in Debug mode first

**Slow responses?**
- Switch to Groq
- Check API key has credits
- Verify internet connection

**Other issues?**
- Check `backend/logs/errors.log`
- Open a GitHub issue

---

## Roadmap (actually happening)

**Coming very soon:**
- [ ] **Test suite automation** - Save conversations as repeatable tests
- [ ] **Export/import configs** - Share setups with your team instantly
- [ ] **Tool analytics dashboard** - Usage stats, performance metrics, error rates
- [ ] **CI/CD integration** - Run MCP tests in GitHub Actions
- [ ] **Team workspaces** - Collaborate on testing scenarios

**Future plans:**
- [ ] Plugin system for custom extensions
- [ ] Cloud deployment option (keep your local setup)
- [ ] Advanced tool monitoring
- [ ] Community tool marketplace

**Want something else? Tell me.** I will try to bring the feature fast.

---

## Why I built this

**The honest story:**

While building MCP servers, testing was painful. Really painful.

- Deploy to Claude Desktop? Slow and clunky.
- Write unit tests? Missing the real AI interaction.
- Use command line? Can't see what's happening.
- Existing tools? Either too basic or too complex.

So I built what i wanted: **A visual playground where you chat naturally and see everything in real-time.**

Turns out other developers wanted it too.

**MCP Station exists because testing should help you ship, not slow you down.**

---

## Contributing (I want your help)

**Found a bug?** → GitHub Issues 
**Have an idea?** → GitHub Discussions  
**Want to code?** → Submit PRs (I will review quickly)  
**Improved docs?** → Every bit helps  
**Built something cool?** → Show me!

**This project gets better when developers like you contribute.**

---

## Requirements

- Python 3.9+ (newer = faster)
- Node.js 18+ (LTS recommended)
- API key (pick one):
  - Groq (free tier, super fast)
  - Google AI Studio (free, generous limits)
  - Vertex AI (enterprise option)

**That's literally it. No Docker, no Kubernetes, no cloud accounts.**

---

## License & Credits

**MIT License** - Use it commercially. Modify it. Ship it. Just keep the license file

**Built by Shubham Mishra** with late nights and lots of coffee ☕



## Support this project

**If MCP Station saves you time:**

⭐ **Star the repo** - Helps others discover it  
🐦 **Share on Twitter** - Spread the word  
🐛 **Report bugs** - Makes it better for everyone  
💻 **Contribute code** - Join the builders  
📝 **Write about it** - Tell your story  

**Every GitHub star motivates us to build more. Don't be shy.**

---

## Get help

**Something broke?**
1. Check `backend/logs/errors.log`
2. Search GitHub Issues
3. Open a new issue with details

**Have questions?**
1. Read this README thoroughly
2. Check GitHub Discussions
3. Ask in MCP Discord community

**Want to chat?**
- Email: smdell83@gmail.com
- GitHub Discussions (preferred)



---

## Final words

**MCP Station is built for developers who value their time.**

No fluff. No complexity. No subscription. No tracking.

Just a solid tool that helps you test MCP servers properly.

**If you're tired of painful testing workflows, give it 5 minutes.**

I think you'll like it.

---

**Ready to ship better MCP tools?**

```bash
git clone https://github.com/yourusername/mcp-station.git
cd mcp-station && pip install -r requirements.txt
cd backend && echo "GROQ_API_KEY=your_key" > .env && python app.py
```

**Now go build something amazing.** 🚀