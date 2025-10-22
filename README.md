# Replate
https://thereplateapp.vercel.app/ 
home page is a lil slow because of the decorations, but wtv

## Connecting surplus food to people who need it (simply and sustainably)

Replate is a web platform that helps link businesses with surplus food and community members in need.  
Instead of discarding leftover food or organizing waste collection, businesses can list surplus items that users can find and reserve nearby.

---

## Why Replate

Many businesses face the tedious process of managing garbage collection for unused food (a system that is both inefficient and wasteful).  
Replate turns this process into an opportunity to help the community while reducing unnecessary waste.

By listing surplus food:
- Businesses save time and resources while earning social impact points.
- Users can search and reserve available food listings nearby.
- The community benefits from reduced waste and increased access to food.

---

## How It Works

1. Businesses register and create listings of available surplus food.  
2. Users browse or search nearby listings through a simple interface.  
3. Reservations allow users to claim available items before they go to waste.

---

## Features

- Secure user and business authentication  
- Business dashboard for managing food listings  
- Location-based food search + google map api

---

## Tech Stack

- Next.js 15 (App Router + Turbopack)  
- Supabase (Database & Authentication)  
- Tailwind CSS + ShadCN (UI styling + component library)  
- TypeScript  
- Vercel (Deployment)

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/yourusername/replate.git

# Navigate into the project directory
cd replate

# Install dependencies
npm install

# Run the development server
npm run dev


Additional Next.js boilerplate
---------------------------------------------------------------------------------------------------------------------------------------

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```
# Example .ENV file
- NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-instance.supabase.co
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-public-anon-key
- GOOGLE_MAPS_API_KEY=your-google-maps-api-key

Additional Next.js boilerplate
---------------------------------------------------------------------------------------------------------------------------------------

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
