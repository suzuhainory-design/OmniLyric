import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Create from "./pages/Create";
import History from "./pages/History";
import LyricView from "./pages/LyricView";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/create"} component={Create} />
      <Route path={"/history"} component={History} />
      <Route path={"/lyric/:id"} component={LyricView} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
