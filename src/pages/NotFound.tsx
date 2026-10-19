import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader } from "@/components/layout/PagePrimitives";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PageShell
        width="reading"
        className="flex flex-1 flex-col justify-center py-16"
      >
        <PageHeader
          kicker="Error 404"
          title="This page isn't part of the roadmap."
          description="The link you followed may be outdated, or the page may have moved. Head back home and pick up where you left off."
          variant="display"
          actions={
            <Button asChild size="cta">
              <Link to="/">Return home</Link>
            </Button>
          }
        />
        <p className="ui-meta mt-6 break-all">{location.pathname}</p>
      </PageShell>
    </div>
  );
};

export default NotFound;
