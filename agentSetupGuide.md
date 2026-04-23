# Getting Started with AI-Assisted Development
### Using Z.ai & YTL AI Labs's ILMU-GLM-5.1 + VS Code
*A friendly, non-technical guide for absolute beginners*

---

## Part 0: Before You Begin — The Big Picture

### A. Welcome! You're About to Become an AI-Enabled Developer

By the end of this guide, you will have a **functional AI coding assistant** on your computer, ready to help you build all kinds of cool projects through a professional code editor — at any time.

**Why this is easier than you think:**
- No complex mathematical knowledge required
- No computer science degree needed
- We use simple English instructions and a very user-friendly large language model

---

### B. The Cooking Analogy — How Everything Fits Together

Think of building a system like cooking a dish:

| Tool | Role |
|------|------|
| **ILMU-GLM-5.1** (by Z.ai & YTL AI Lab) | Your exclusive chef — knows thousands of recipes and masters the art of combining ingredients with the right techniques |
| **VS Code** | Your clean, modern kitchen workspace where the magic happens |
| **Claude Code Plugin** | A smart meal-ordering device — lets you tell the chef exactly what you want, while also showing the chef what equipment and ingredients are available |

---

### C. What You Need (Shopping List)

- [ ] A personal computer
- [ ] An internet connection
- [ ] A browser (to download things)

That's it. Nothing else required.

---

## Step 1: Set Up Your Code Editing Space

### A. What is VS Code?

VS Code is a **free, clean, and efficient code editor**. Think of it as Microsoft Word or Excel — but designed specifically for writing code.

### B. Download and Install VS Code

1. Visit the official website: **https://code.visualstudio.com/**
2. Click the **download button** for your operating system (Windows, Mac, Linux, etc.)
3. Install it just like any other application, then open it

> ✅ If you can open VS Code and see the welcome screen, you're ready for Step 2.

---

## Step 2: Prepare the Necessary Tools

### Understanding the VS Code Interface

When you open VS Code, there are three key areas:

| Area | What It Does |
|------|--------------|
| **Sidebar (File Explorer)** | View and manage your project files |
| **Main Editor** | The large area where code is written and displayed |
| **Extensions Icon (Puzzle Piece)** | Button to add new plugins and features |

### Installing the Required Extensions

You only need to install **two things** inside VS Code:

#### 1. Python

It is strongly recommended to follow the official VS Code Python tutorial first to ensure Python is installed and working on your specific system:
👉 https://code.visualstudio.com/docs/python/python-tutorial

**Steps:**
1. Click the **Extensions icon** (puzzle piece) in the left sidebar
2. Search `python` in the search bar
3. Click **Install** and wait for completion

#### 2. Claude Code

1. In the same Extensions search bar, type `Claude Code`
2. Click **Install** and wait for completion
3. You will see the **Claude Code icon** appear in the left sidebar

> ⚠️ **Note on Login:** Claude Code may prompt you to log in. Don't worry — once you configure your API key in Step 3, it will automatically skip the login screen. See the configuration guide here:
> https://www.how2shout.com/how-to/enable-disable-claude-code-dangerously-skip-permissions-vs-code.html

### Manual Configuration (Optional — If You Prefer to Do It Yourself)

Go to **Extensions → Settings → Edit in settings.json** and add the following:

```json
"claudeCode.environmentVariables": [
  {
    "name": "ANTHROPIC_BASE_URL",
    "value": "https://api.ilmu.ai/anthropic"
  },
  {
    "name": "ANTHROPIC_AUTH_TOKEN",
    "value": "YOUR_API_KEY_HERE"
  },
  {
    "name": "ANTHROPIC_MODEL",
    "value": "YOUR_MODEL_KEY_HERE"
  }
],
"claudeCode.disableLoginPrompt": true,
"claudeCode.selectedModel": ""
```

> 💡 Alternatively, use **cc-switch** (recommended) for a visual, no-code configuration experience — explained in Step 3.

### Test Your Setup: Hello World

1. Create a **new folder** on your Desktop
2. In VS Code, click the folder icon → **Open Folder** → select your new folder
3. Click the **New File** icon and create a file named `myapp.py`
4. Type the following inside the file:
   ```python
   print("hello world!")
   ```
5. Click the **Run button** (▶) in the top-right corner

> ✅ If you see `hello world!` printed in the terminal at the bottom — Python is working perfectly!

---

## Step 3: Connect AI — Install and Configure ILMU-GLM-5.1

### How It All Works Together

- **Python** tells your computer where to find the language runtime
- **VS Code** gives you a space to manage files and run code
- **Claude Code** translates what you see on screen and what you type into instructions the AI can understand and act on
- **ILMU-GLM-5.1** is the AI brain that receives those instructions and writes the code

### Step-by-Step: Connect to ILMU-GLM-5.1

#### 1. Download cc-switch (Recommended)

cc-switch gives you a simple visual interface to manage your API keys and providers — no manual JSON editing required.

👉 Download: https://github.com/farion1231/cc-switch/releases

#### 2. Get Your API Key

1. Go to: **https://console.ilmu.ai/dashboard**
2. Log in to your account
3. Navigate to **Console → API Keys**
4. Click **Create API Key**, then **copy it**

> 🔐 **Keep your API key private.** Never share it publicly or commit it to GitHub.

For full documentation on parameters and models:
👉 https://docs.ilmu.ai/docs/getting-started/overview

#### 3. Configure cc-switch

1. Open **cc-switch**
2. Create a new provider configuration with these settings:

| Field | Value |
|-------|-------|
| **URL** | `https://api.ilmu.ai/anthropic` |
| **Advanced Options → API Format** | `Anthropic Messages` |
| **Auth Field** | `ANTHROPIC_AUTH_TOKEN` (Default) |
| **API Key** | Paste your key from Step 2 |

3. **Enable** the configuration

#### 4. Verify the Connection

1. Return to VS Code
2. Open a **new Claude Code conversation**
3. Type: `hi`
4. Wait a moment — you should receive a response from **ILMU-GLM-5.1**

> 🎉 If you see a response, your AI coding assistant is live and ready!

---

## Step 4: Build Your First AI-Generated Project

### A. Let's Build Something Real — A Chatbot

If you don't have any ideas yet, ask the AI itself! Try typing:

```
I am a beginner in AI, and I want to create a simple project that can be 
run with a single script. Do you have any good suggestions?
```

Then follow up with:

```
I don't quite understand the Python environment or installed packages. 
Could you guide and design it step by step for me to create a cool 
front-end page? Then tell me how to open it.
```

### B. The Art of Prompting — How to Talk to AI Effectively

Your instructions to the AI are called **prompts**. Here's how to write good ones:

- **Be specific about what you want**
  > "Create a to-do list app with a dark theme and the ability to mark items as complete"

- **Iterate freely — don't settle for the first result**
  > "It's good, but can you make the style more tech-savvy?"

- **Ask for explanations if you're curious**
  > "Can you add comments to explain what each line of code does?"

- **Describe your constraints**
  > "I want this to run as a single Python file with no extra dependencies"

### C. Useful Resources

| Resource | Link |
|----------|------|
| Z.ai AI Chat (SOTA model) | https://chat.z.ai/ |
| ILMU Chat | https://chat.ilmu.ai/ |
| ILMU MaaS Platform (Console) | https://console.ilmu.ai/ |
| Z.ai Model API | https://z.ai/model-api |
| ILMU Documentation | https://docs.ilmu.ai/docs/getting-started/overview |
| How to Run Python in VS Code (YouTube) | https://www.youtube.com/watch?v=m_TsMTRL_aI |
| Claude's Website | https://claude.ai/ |

---

## Conclusion: You Are Now an AI Coder 🎉

**Quick review of what you've accomplished:**
1. ✅ Set up a professional coding environment (VS Code)
2. ✅ Installed Python and the Claude Code extension
3. ✅ Connected to ILMU-GLM-5.1 via cc-switch
4. ✅ Generated and ran your first AI-assisted code

You've just opened the door to a brand new creative world.

Don't be afraid to experiment. Don't be afraid to make "silly" requests. AI is your partner — the more you talk to it, the better your results will be.

**Happy coding! 🚀**

---

*Guide based on Z.ai & YTL AI Labs ILMU-GLM-5.1 documentation. For the latest information, visit https://docs.ilmu.ai*