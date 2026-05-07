# TenderFlow

Kenya's tender intelligence platform — helping suppliers find, evaluate, and win government tenders.

## What is TenderFlow?

TenderFlow is a web platform that:
- Collects and publishes government tender notices
- Automatically scores tenders against 42 compliance parameters using AI
- Helps suppliers understand their chances before bidding
- Gives admins a dashboard to manage tenders, users, and activity

## Project Structure

```
TenderFlow/
├── backend/     Node.js + Express API — handles uploads, scoring, users, AI analysis
├── frontend/    Public landing page — tender listings, supplier registration & login
├── admin/       Admin panel — upload tenders, manage users, view activity logs
```

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | Node.js, Express, SQLite (sql.js)   |
| AI        | Anthropic Claude API                |
| Frontend  | Plain HTML/CSS/JavaScript           |
| Fonts     | Outfit + Nunito (Google Fonts)      |
| Theme     | Cream background, teal accents, dark navy gradients |

## Development Order

1. **Backend API** ← starting here
2. Public landing page
3. Admin panel
4. Chrome extension (later)

## Getting Started

> Setup instructions will be added as each part is built.
