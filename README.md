# Job Hunt Hub

AI-powered job application tracker that pulls in live job postings and scores your resume against each one.

**[Live app](https://jobhunthubcom.lovable.app)** · **[Repo](https://github.com/saikumarcheerneni/job-hunt-hub)**

## Why

Most job trackers just log where you applied. I wanted one that actually helps you get the interview, so I built Job Hunt Hub. Instead of manually tracking applications, it pulls real job postings and tells you what to fix in your resume before you apply.

## What it does

- Pulls live job postings from the Adzuna API, filtered by keyword and location
- Save any posting to a personal tracker with status (saved, applied, interview, rejected)
- Paste your resume once, then click "Match resume" on any saved job
- A backend function sends your resume and that job's real description to Claude, which returns a match score, missing skills, and specific resume bullet rewrites tailored to that role
- Auth and data sync across devices through a Postgres database, so your tracker follows you between sessions

## How it's built

- **Frontend**: React
- **Auth & Database**: Supabase (Postgres)
- **Job data**: Adzuna API, called through a backend edge function so the API keys never reach the browser
- **Resume matching**: Claude API, called through a separate backend edge function, prompted to return structured JSON (score, missing skills, bullet suggestions) rather than free text

I built the UI scaffolding with Lovable and wrote the API integrations and prompt design myself, since getting reliable structured output out of an LLM for something people actually use was the part I wanted to learn.

## Architecture notes

Both external API calls (Adzuna and Claude) run through backend edge functions rather than directly from the client. API keys are stored as server-side secrets. This was a deliberate choice, not a default, since exposing keys in frontend code is a common and avoidable mistake.
