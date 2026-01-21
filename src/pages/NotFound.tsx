
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PageLayout from "@/components/Layout/PageLayout";

const NotFound = () => {
  return (
    <PageLayout>
      <div className="civic-container flex flex-col items-center justify-center py-20">
        <h1 className="text-6xl font-bold text-civic-blue mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-gray-600 text-center max-w-md mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button asChild className="bg-civic-teal hover:bg-civic-teal/90">
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </PageLayout>
  );
};

export default NotFound;
