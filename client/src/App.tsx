import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { AuthProvider } from "@/lib/auth-context";
import NotFound from "@/pages/not-found";
import Navbar from "@/components/layout/Navbar";
import Home from "@/pages/Home";
import Events from "@/pages/Events";
import EventDetail from "@/pages/EventDetail";
import Checkout from "@/pages/Checkout";
import MyTickets from "@/pages/MyTickets";
import TicketDetail from "@/pages/TicketDetail";
import ResaleMarket from "@/pages/ResaleMarket";
import Integrity from "@/pages/Integrity";
import AdminDashboard from "@/pages/AdminDashboard";
import ApiDocs from "@/pages/ApiDocs";
import FanPortal from "@/pages/FanPortal";
import Onboarding from "@/pages/Onboarding";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Standings from "@/pages/Standings";
import Profile from "@/pages/Profile";
import Scanner from "@/pages/Scanner";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/events" component={Events} />
      <Route path="/events/:id" component={EventDetail} />
      <Route path="/checkout/:eventId" component={Checkout} />
      <Route path="/my-tickets" component={MyTickets} />
      <Route path="/tickets/:id" component={TicketDetail} />
      <Route path="/resale" component={ResaleMarket} />
      <Route path="/integrity" component={Integrity} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/api-docs" component={ApiDocs} />
      <Route path="/fan-portal" component={FanPortal} />
      <Route path="/standings" component={Standings} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/profile" component={Profile} />
      <Route path="/scanner" component={Scanner} />
      <Route path="/validate-ticket" component={Scanner} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("tickfan-onboarding-seen");
    if (!seen) setShowOnboarding(true);
  }, []);

  const handleOnboardingComplete = () => {
    localStorage.setItem("tickfan-onboarding-seen", "true");
    setShowOnboarding(false);
  };

  const noNavPages = ["/login", "/register"];
  const showNav = !noNavPages.includes(location);

  if (showOnboarding && showNav) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-white">
      {showNav && <Navbar />}
      <main>
        <Router />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
