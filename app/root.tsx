import type {
  LinksFunction,
  LoaderArgs,
  V2_MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";

import tailwindStylesheetUrl from "./styles/tailwind.css";
import { getUser } from "./session.server";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: tailwindStylesheetUrl }];
};

export const meta: V2_MetaFunction = () => [
  { title: "Crossroads Youth Mulch Fundraiser" },
  {
    name: "description",
    content:
      "Welcome to the Crossroads Youth Group Mulch Sale fundraiser! We are thrilled to be launching this campaign to raise funds for our group's various programs and activities.",
  },
  { property: "og:image", content: "/assets/mulch_wagon.jpg" },
];

export async function loader({ request }: LoaderArgs) {
  return json({
    user: await getUser(request),
    ENV: {
      PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
    },
  });
}

export default function App() {
  const data = useLoaderData<typeof loader>();
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <Outlet />
        <ScrollRestoration />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
