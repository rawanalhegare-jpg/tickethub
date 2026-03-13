import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Ticket, Star, LogOut, User, BarChart2, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Fixtures" },
  { href: "/standings", label: "Standings" },
  { href: "/resale", label: "Resale" },
  { href: "/scanner", label: "Scanner" },
  { href: "/integrity", label: "Integrity" },
];

export default function Navbar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-md bg-sport-gradient flex items-center justify-center shadow-sm">
              <Ticket className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold text-sport-blue tracking-tight font-[Montserrat]">
                TIKFAN
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-1" data-testid="nav-desktop">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}>
                <button
                  data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, "-")}`}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                    isActive(link.href)
                      ? "bg-blue-50 text-sport-blue font-semibold"
                      : "text-gray-600 hover:text-sport-blue hover:bg-blue-50"
                  }`}
                >
                  {link.label}
                </button>
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <Link href="/my-tickets">
                  <Button variant="outline" size="sm" data-testid="btn-my-tickets">
                    <Ticket className="w-4 h-4 mr-1" />
                    My Tickets
                  </Button>
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid="btn-user-menu" className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                        {(user.displayName || user.username)[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{user.displayName || user.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="w-4 h-4 mr-2" />
                        My Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/fan-portal">
                        <Star className="w-4 h-4 mr-2" />
                        Fan Portal
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <BarChart2 className="w-4 h-4 mr-2" />
                        Admin Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} data-testid="btn-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm" data-testid="btn-login">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" data-testid="btn-register">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" data-testid="btn-mobile-menu">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-sport-gradient flex items-center justify-center">
                      <Ticket className="w-4 h-4 text-white" />
                    </div>
                    <span className="font-bold text-sport-blue">TIKFAN</span>
                  </div>
                </div>
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                  {navLinks.map((link) => (
                    <Link key={link.href} href={link.href}>
                      <button
                        onClick={() => setMobileOpen(false)}
                        className={`w-full text-left px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                          isActive(link.href)
                            ? "bg-blue-50 text-sport-blue font-semibold"
                            : "text-gray-600 hover:text-sport-blue hover:bg-blue-50"
                        }`}
                      >
                        {link.label}
                      </button>
                    </Link>
                  ))}
                  {user && (
                    <>
                      <Link href="/my-tickets">
                        <button onClick={() => setMobileOpen(false)} className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:text-sport-blue hover:bg-blue-50">My Tickets</button>
                      </Link>
                      <Link href="/profile">
                        <button onClick={() => setMobileOpen(false)} className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:text-sport-blue hover:bg-blue-50">Profile</button>
                      </Link>
                      <Link href="/fan-portal">
                        <button onClick={() => setMobileOpen(false)} className="w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-gray-600 hover:text-sport-blue hover:bg-blue-50">Fan Portal</button>
                      </Link>
                    </>
                  )}
                </nav>
                <div className="p-4 border-t space-y-2">
                  {user ? (
                    <>
                      <div className="flex items-center gap-2 px-2 py-1 text-sm text-gray-700 font-medium">
                        <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
                          {(user.displayName || user.username)[0].toUpperCase()}
                        </div>
                        {user.displayName || user.username}
                      </div>
                      <Button variant="outline" className="w-full" onClick={() => { logout(); setMobileOpen(false); }} data-testid="btn-mobile-logout">
                        <LogOut className="w-4 h-4 mr-2" />Sign Out
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="outline" className="w-full" onClick={() => setMobileOpen(false)}>Sign In</Button>
                      </Link>
                      <Link href="/register">
                        <Button className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => setMobileOpen(false)}>Get Started</Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
