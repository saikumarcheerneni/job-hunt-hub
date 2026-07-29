# Job Hunt Hub

Job Hunt Hub is a job application tracker that goes past a simple spreadsheet. Instead of manually logging jobs, it pulls in live postings from the Adzuna API and uses Claude to score how well my resume matches each one, so I know what to fix before applying.

I built this because most job trackers are just a status board. The part I actually wanted to solve was the AI matching, given a real job description and my resume, tell me what's missing and what to change, not just track that I applied somewhere.

How it works: users sign in with email or Google, and their data is stored in a Postgres database so it syncs across devices. The job search tab calls a backend function that queries the Adzuna API for live Canadian job postings, the API keys are stored as server-side secrets and never exposed to the browser. When a user pastes their resume and clicks "Match resume" on a saved job, a second backend function sends the resume and the job's full description to Claude, which returns structured JSON: a match score, missing skills, and suggested resume bullet rewrites.

Tech stack: React frontend, Supabase for auth and Postgres database, backend edge functions for the Adzuna and Claude API calls, Claude API for resume matching, Adzuna API for live job data.

Built with Lovable for the UI scaffolding, with the API integrations and prompt design done manually.
