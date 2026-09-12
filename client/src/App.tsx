import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import ArticleDetail from "./pages/ArticleDetail";
import Articles from "./pages/Articles";
import { EditorArticleForm, EditorDashboard, EditorPreview } from "./pages/Editor";
import Home from "./pages/Home";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/articles"} component={Articles} />
      <Route path={"/articles/:slug"} component={ArticleDetail} />
      <Route path={"/editor"} component={EditorDashboard} />
      <Route path={"/editor/articles/new"} component={EditorArticleForm} />
      <Route path={"/editor/articles/:id/preview"} component={EditorPreview} />
      <Route path={"/editor/articles/:id"} component={EditorArticleForm} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
