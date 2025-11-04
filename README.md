This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

Install dependencies and generate the Prisma client:

```bash
npm install
npx prisma generate
```

Create an `.env` file based on `.env.example` with your PostgreSQL connection string, `AUTH_SECRET`, and OAuth credentials from Discord, GitHub, and Google.

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the authentication demo. The home page now renders a sign-in experience powered by NextAuth with Discord, GitHub, and Google providers backed by Prisma and PostgreSQL.

## Database setup

After configuring your environment variables, create the database schema with Prisma migrations:

```bash
npx prisma migrate dev
```

This will create the required tables for NextAuth in your PostgreSQL database and generate the Prisma client for use inside the app.
