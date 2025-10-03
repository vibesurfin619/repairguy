# RepairGuy

A modern, responsive Next.js application for a repair service business, built with Tailwind CSS.

## Features

- 🎨 Beautiful, modern UI with Tailwind CSS
- 🌙 Dark mode support
- 📱 Fully responsive design
- ⚡ Built with Next.js 15 and React 18
- 🔧 TypeScript for type safety
- 💨 Fast development with hot reloading

## Getting Started

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
repairguy/
├── src/
│   └── app/
│       ├── globals.css
│       ├── layout.tsx
│       └── page.tsx
├── public/
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Available Scripts

- `npm run dev` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm run start` - Runs the built app in production mode
- `npm run lint` - Runs ESLint to check for code issues

## Technologies Used

- **Next.js 15** - React framework for production
- **React 18** - JavaScript library for building user interfaces
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Static type checking
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## Customization

### Tailwind Configuration

The Tailwind configuration is located in `tailwind.config.ts`. You can customize colors, fonts, spacing, and other design tokens here.

### Global Styles

Global CSS and Tailwind directives are in `src/app/globals.css`.

## Deployment

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [React Documentation](https://reactjs.org/) - learn React
- [Tailwind CSS Documentation](https://tailwindcss.com/docs) - learn Tailwind CSS
- [TypeScript Documentation](https://www.typescriptlang.org/docs/) - learn TypeScript
