# character-landing — a Claude skill

Turn **one reference image** into an **animated landing page** starring that character:

- **The hero:** the character peeks up from the bottom of the screen, big, and its **eyes follow your cursor**.
- **Scrolling:** it zooms out and **strikes a new pose for every section** (sketching, skating, twirling…). The motion between poses scrubs with the scroll.
- **The look:** each section has its own vibrant gradient, with a font pairing and background style chosen to suit the character.

Works with photos of yourself (stylised into a Pixar-style or illustrated character), illustrations, drawings, or a plain text idea.

---

## Quick start (for humans)

Paste this into **Claude Code** (or the Claude desktop app's Code tab):

> Install and use the skill from https://github.com/wcm/character-landing-skill — I want a landing page for my character.

Claude will install the skill, check your setup, ask for a reference image and your fal API key, and build the page step by step. It shows you every image before spending money on video.

**What you need**

| | |
|---|---|
| A reference image | a photo, illustration or character art (PNG/JPG/WebP) |
| A **fal.ai API key** | create one at https://fal.ai/dashboard/keys. Generation costs roughly **$2–5 per character** (a few images plus three 5-second video clips). |
| Node.js 18+, ffmpeg, Python 3 | on macOS: `brew install node ffmpeg python` |

---

## For Claude: what to do when a user gives you this repo URL

You are reading the README of a Claude skill. Your job is to install it and then use it for the user's request.

### 1. Install the skill

**Claude Code / desktop Code tab (has a terminal):**

```bash
git clone https://github.com/wcm/character-landing-skill ~/.claude/skills/character-landing
```

If that folder already exists, update it instead: `git -C ~/.claude/skills/character-landing pull`.
A newly installed skill is picked up on the next session. For this session, read `~/.claude/skills/character-landing/SKILL.md` and follow it directly; you don't need to restart.

**Claude.ai / Claude app chat (no terminal):** tell the user to download this repo as a ZIP (green **Code** button → **Download ZIP**) and upload it under **Settings → Capabilities → Skills** (code execution must be on). Note that the build pipeline needs Node, ffmpeg and network access to fal.ai, which works best in Claude Code. Recommend Claude Code if they have it.

### 2. Check prerequisites

Run `node -v` (needs 18+), `ffmpeg -version`, `python3 -V`. If something is missing, tell the user the one-line install (macOS: `brew install node ffmpeg python`; Windows: `winget install OpenJS.NodeJS Gyan.FFmpeg Python.Python.3.12`) and wait for them.

### 3. Collect inputs

Ask in one short message:
- **The reference image** (a file path, or attach it).
- **A fal API key.** Use it only as an environment variable on each command (`FAL_KEY=… node generate.mjs …`). Never write it to a file and never repeat it back.
- **Optional:** the character's name, the vibe or tone of the copy, the style (e.g. "Pixar 3D" or "keep the exact illustration style"), framing (full body or waist-up), fonts and colours. If they don't specify these, choose them yourself using `references/themes.md`, and state what you chose.

### 4. Run the skill

Follow `SKILL.md` from Step 0. Start with `scripts/new_project.py` to scaffold the project, and stop for the user's approval after the rest still, after the pose stills, and before the video clips.

---

## What's inside

```
SKILL.md                      the workflow Claude follows (start here)
references/
  character-json.md           every field of character.json + how to write image/pose prompts
  themes.md                   picking fonts, title style and gradient when the user gives no instructions
  eyes.md                     calibrating the cursor-following eyes
  troubleshooting.md          known failure modes and fixes
scripts/new_project.py        scaffolds a new project folder from the template
assets/template/              the site (HTML/CSS/JS) and the generator (tools/generate.mjs, tools/eyes.py)
assets/examples/              one complete character.json, for structure only (every new character is written fresh)
```

### How a generated project is laid out

```
my-page/
  site/                       static site, open with: python3 -m http.server 5174 -d site
    characters/<id>/          character.json, hero.webp, seq/ (keyed animation frames)
  tools/generate.mjs          FAL_KEY=… node generate.mjs <id> --steps image | poses | clips | frames
  ref/                        your reference image (git-ignored)
```

The result is a plain static site: no build step and no framework. Deploy the `site/` folder to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages).

### Notes

- **Your images.** If you use someone else's artwork as the reference, get their permission or credit them before publishing. Photos of real people should be of you, or used with consent.
- **Trademarked characters** (e.g. famous cartoon mascots) are usually refused by the image model. The skill suggests an original character with the same energy instead.
- **Models used:** fal `nano-banana-pro` (stills and edits) and `kling-video/v3/pro/image-to-video` (pose-to-pose clips). Prices and availability are set by fal.

## License

MIT — see [LICENSE](LICENSE). Images you generate with the skill are yours, subject to fal's terms and the rights in your reference image.
