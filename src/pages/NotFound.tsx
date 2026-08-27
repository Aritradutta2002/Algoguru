import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="text-center max-w-sm">
        <h1 className="mb-3 text-5xl font-bold tracking-tight">404</h1>
        <p className="mb-5 text-base text-muted-foreground">Oops! The page you’re looking for doesn’t exist.</p>
        <a href="/" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground hover:brightness-95">
          Return home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
