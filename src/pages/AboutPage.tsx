import PageLayout from "@/components/Layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const AboutPage = () => {
  return (
    <PageLayout>
      <div className="civic-container py-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">About BolBharat</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Empowering citizens to take an active role in improving their communities
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              BolBharat was created to bridge the gap between citizens and local governments. We believe that the people who live in a community are best positioned to identify issues that need attention.
            </p>
            <p className="text-gray-700 mb-4">
              Our platform makes it easy for residents to report problems like potholes, broken streetlights, garbage, graffiti, and other issues that affect quality of life and public safety.
            </p>
            <p className="text-gray-700">
              By streamlining communication between citizens and local authorities, we help ensure that problems are addressed quickly and efficiently, creating better, safer, and more livable communities for everyone.
            </p>
          </div>
          <div className="flex justify-center">
            <img 
              src="/public/logo-hindi.png" 
              alt="Community collaboration" 
              className="rounded-lg shadow-lg max-w-md w-full"
            />
          </div>
        </div>
        
        <Card className="mb-16 bg-civic-light">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-6 text-center">How BolBharat Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-civic-teal text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h3 className="text-xl font-semibold mb-2">Report</h3>
                <p className="text-gray-700">
                  Citizens submit reports with photos, descriptions, and location details of civic issues they encounter.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-civic-teal text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h3 className="text-xl font-semibold mb-2">Track</h3>
                <p className="text-gray-700">
                  Reports are categorized and tracked through the resolution process, with updates provided to the reporter.
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-civic-teal text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h3 className="text-xl font-semibold mb-2">Resolve</h3>
                <p className="text-gray-700">
                  Local authorities receive detailed information to efficiently address issues and improve community conditions.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold mb-6">Why Use BolBharat?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="pt-6 text-center">
                <h3 className="text-xl font-semibold mb-3">Easy to Use</h3>
                <p className="text-gray-700">
                  Simple reporting process that takes less than a minute to complete.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <h3 className="text-xl font-semibold mb-3">Transparent</h3>
                <p className="text-gray-700">
                  Track the status of your reports and see when issues are resolved.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <h3 className="text-xl font-semibold mb-3">Community-Focused</h3>
                <p className="text-gray-700">
                  Join others in taking an active role in improving your neighborhood.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6 text-center">
                <h3 className="text-xl font-semibold mb-3">Gets Results</h3>
                <p className="text-gray-700">
                  Structured reports help authorities respond faster and more effectively.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="bg-civic-blue rounded-lg p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl mb-6">
            Join thousands of community members who are using BolBharat to create positive change.
          </p>
          <Button asChild size="lg" className="bg-white text-civic-blue hover:bg-white/90">
            <Link to="/report">Report an Issue Now</Link>
          </Button>
        </div>
      </div>
    </PageLayout>
  );
};

export default AboutPage;
