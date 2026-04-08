# Suno API React Application: Prompt Guide

Here is a step-by-step guide outlining the AI prompts used to generate this music creation application. Each prompt includes a breakdown of *what* it does and *why* it is structured that way, allowing anyone to replicate or iterate on this project.

## Step 1: Core Application Generation

**The Prompt:**
> "87f56749c88278478e7a67dcfeaba273 this is the key for sunoapi.org. I want you to go through and take a good hard look at all of the docs. By the way here's the URL for the docs:  https://docs.sunoapi.org/ based off of that what I want you to do is create a one-page application where the user can put in their idea for a song. They can select whatever model they want and default to the latest and greatest model. They can have the option to have lyrics or not have lyrics. Make sure there is a flag for that. Make sure that you keep the user informed on the status. As the song is being built make sure the user can play the song and can see the lyrics. I think there are two songs that come back; make sure the user can access both of those songs and can see the cover art and the lyrics, like I said. What else? Oh make sure the user can download the music also if they want to but start by diving deep into the docs and then go ahead and build that one-page app. Importantly this application needs to be a React application. I want this as a React application because ultimately I'm going to push it out to GitHub and I'm going to deploy it on Netlify so keep that context in mind."

**What This Does:** 
- Provides the AI with the necessary API key and the exact documentation URL so it can dynamically learn the latest API endpoints, required headers, and parameter schemas before writing any code.
- Outlines the functional requirements structurally: single-page app framework, model selector (defaulting to the latest), lyric toggles, state/status management, music playback, lyric viewing, and download capability.
- Dictates the tech stack (React) and the infrastructure destinations (GitHub & Netlify).

**Why It's Important:** 
Providing the official documentation upfront is critical. AI models are trained on historical data, but external APIs frequently change. By instructing the AI to read the live docs first, you prevent deprecated code and guarantee it uses the correct HTTP payload structures for Suno API. By specifying it's for Netlify, the AI intuitively sets up proper build scripts (e.g., `netlify.toml`).

---

## Step 2: Local Execution & Testing

**The Prompt:**
> "Okay please go ahead and run it so I can test it."

**What This Does:** 
- Commands the AI agent to execute the standard local development environment commands (such as `npm run dev` for Vite/React applications).

**Why It's Important:** 
Allows you to verify the application locally to ensure it is functioning exactly as intended before pushing to production or dealing with GitHub source control. Validation is key before proceeding.

---

## Step 3: Documentation For Handoff

**The Prompt:**
> "please extract all of the prompts that I put in for this and give me the prompts in a document named prompts.md and put that in a new folder called docs" *(Note: Expanded based on the final request)*

**What This Does:** 
- Commands the AI to catalog its own instructions into a digestible markdown document (`docs/prompts.md`).

**Why It's Important:** 
This makes the prompt sequence completely deterministic and reproducible. It serves as an operating manual, so another developer (or non-technical user) can simply feed these exact prompts back to an AI coding assistant and end up with the same application logic.

---

## 🛠️ Troubleshooting & Iteration Guide

If you are using these prompts to recreate this application and you encounter an error when the application runs, follow this iteration framework by providing the AI with a prompt similar to the one below:

> **Example Troubleshooting Prompt:** 
> *"I ran the application, but I encountered an error. Here is a screenshot of the error [upload screenshot], and here is the terminal/console error text: [paste error text]. Please go back and reference the Suno API documentation at https://docs.sunoapi.org/ to cross-reference our payload structure or endpoints, diagnose the issue, and provide a fix."*

**The Iteration Process:**
1. **Never Panic:** Errors are completely normal when dealing with ever-evolving third-party APIs.
2. **Provide Maximum Context:** Always give the AI the exact error text **plus** a screenshot. Sometimes UI/visual errors are explicitly obvious in a picture that the terminal missed.
3. **Bring It Back To The Docs:** The API may have updated since this guide was compiled. By explicitly telling the AI to re-read the documentation with the error in mind, it forces the AI to look for updated schemas instead of assuming/guessing a fix based on outdated historical data. 
4. **Iterate:** Have the AI apply the fix, test it locally again via `npm run dev`, and repeat this cycle until the application successfully generates your music. 
