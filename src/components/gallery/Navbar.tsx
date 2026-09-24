"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Lock, Heart, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setIsAdmin(d.authenticated))
      .catch(() => {});
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-[1800px] px-3 sm:px-4 lg:px-6">
        <div className="flex h-14 items-center justify-between gap-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-pink-500 text-amber-950 font-bold text-sm shadow-md shadow-amber-500/30">
              D
            </span>
            <span className="font-semibold text-sm sm:text-base tracking-tight">
              DouhaLaribiLive
              <span className="hidden sm:inline text-muted-foreground font-normal">
                {" "}
                · Archivo
              </span>
            </span>
          </Link>

          {/* Right */}
          <div className="flex items-center gap-2">
            <a
              href="https://www.instagram.com/douhalaribilive/"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Instagram
              </Button>
            </a>
            <a
              href="https://www.patreon.com/cw/DouhaLaribiLive"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex"
            >
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Heart className="h-3.5 w-3.5 mr-1.5 text-pink-500" />
                Patreon
              </Button>
            </a>
            <Link href={isAdmin ? "/admin" : "/login"}>
              <Button
                size="sm"
                variant={isAdmin ? "default" : "outline"}
                className={
                  isAdmin
                    ? "bg-amber-500 text-amber-950 hover:bg-amber-400 border-0"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }
              >
                <Lock className="h-3.5 w-3.5 mr-1.5" />
                {isAdmin ? "Panel" : "Admin"}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
