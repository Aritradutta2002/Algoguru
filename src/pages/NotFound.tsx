import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Code2, Home } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-background px-4 py-16">
      <div className="w-full max-w-md text-center">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Error 404
        </span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          The page or resource you requested doesn't exist or has moved.
        </p>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <Link
            to="/"
            className="inline-flex h-9 w-full sm:w-auto items-center justify-center gap-2 rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Home size={14} />
            Return to Dashboard
          </Link>
          <Link
            to="/practice"
            className="inline-flex h-9 w-full sm:w-auto items-center justify-center gap-2 rounded-md border border-border bg-card px-4 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Code2 size={14} />
            Browse Practice
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
