import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import NavBar from "@/components/NavBar";
import "../globals.css";
import React from "react";
import {Auth0Provider} from "@auth0/nextjs-auth0";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ravio Test Next JS",
  description: "Raivo Playground for Next JS",
};

export default function RootLayout({children}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
          <html lang="en" className="overflow-hidden w-full h-full">
            <Auth0Provider>
              <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-full h-full min-w-full w-full`}>
                <NavBar/>
                  {children}
              </body>
            </Auth0Provider>
          </html>
  );
}

