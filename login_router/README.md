# Login router for terry

Single login page that redirects the user to the correct instance based on the token.

Place `accounts.json` in the working directory of the webserver, and it should contain:

```json
{
    "token1": { "url": "https://instance1.whatever.com" },
    "token2": { "url": "https://instance1.whatever.com" },
    "token3": { "url": "https://instance2.whatever.com" }
}
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
