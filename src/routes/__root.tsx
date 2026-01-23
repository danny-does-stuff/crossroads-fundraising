/// <reference types="vite/client" />
import type { ReactNode } from "react";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles/app.css?url";
import type { UserInSession } from "~/models/user.server";
import type { ClientConfig } from "~/config";

export interface RouterContext {
  user: UserInSession | null;
  ENV: {
    STRIPE_PUBLISHABLE_KEY: string | undefined;
  };
  wardConfig: ClientConfig;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: ({ matches }) => {
    const wardConfig = matches[0].context.wardConfig;
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { title: `${wardConfig.wardName} Youth Mulch Fundraiser` },
        {
          name: "description",
          content: `Welcome to the ${wardConfig.wardName} Youth Group Mulch Sale fundraiser! We are thrilled to be launching this campaign to raise funds for our group's various programs and activities.`,
        },
        {
          property: "og:image",
          content: wardConfig.ogImage,
        },
      ],
      links: [{ rel: "stylesheet", href: appCss }],
    };
  },
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
  const { ENV, wardConfig } = Route.useRouteContext();

  return (
    <html lang="en" className="h-full">
      <head>
        <HeadContent />
      </head>
      <body className="h-full">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(
              ENV
            )}; window.WARD_CONFIG = ${JSON.stringify(wardConfig)};`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}
