import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: { default: "Private DAO Voting", template: "%s | Private DAO Voting" },
  description:
    "A prototype for verifiable DAO voting that conceals the member-to-ballot link.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
