/// <reference types="vite/client" />
import type { ReactNode } from "react";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
  ScrollRestoration,
} from "@tanstack/react-router";

import appCss from "../styles/tailwind.css?url";
import type { UserInSession } from "~/models/user.server";

export interface RouterContext {
  user: UserInSession | null;
  ENV: {
    STRIPE_PUBLISHABLE_KEY: string | undefined;
  };
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Crossroads Youth Mulch Fundraiser" },
      {
        name: "description",
        content:
          "Welcome to the Crossroads Youth Group Mulch Sale fundraiser! We are thrilled to be launching this campaign to raise funds for our group's various programs and activities.",
      },
      { property: "og:image", content: "/assets/mulch_wagon.jpg" },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  const { ENV } = Route.useRouteContext();

  return (
    <html lang="en" className="h-full">
      <head>
        <HeadContent />
      </head>
      <body className="h-full">
        {children}
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(ENV)}`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
