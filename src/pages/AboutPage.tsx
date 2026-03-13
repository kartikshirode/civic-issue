import PageLayout from "@/components/Layout/PageLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { CheckCircle2, Megaphone, MapPin, ShieldCheck, Sparkles } from "lucide-react";

const AboutPage = () => {
  const pillars = [
    {
      title: "Citizen First",
      description: "Any resident can raise a local issue in minutes with location, evidence, and context.",
      icon: Megaphone,
    },
    {
      title: "Actionable Reporting",
      description: "Structured fields and categories help authorities triage quickly and route the issue correctly.",
      icon: ShieldCheck,
    },
    {
      title: "Map-Based Transparency",
      description: "People can track where problems cluster and how resolution is progressing over time.",
      icon: MapPin,
    },
  ];

  const values = [
    "Report with photo evidence",
    "Track status from reported to resolved",
    "Support issues from your neighborhood",
    "Improve civic accountability through visibility",
  ];

  return (
    <PageLayout>
      <div className="civic-container py-8 space-y-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FF7722] via-[#FF8B42] to-[#FF9D57] px-6 py-10 md:px-10 md:py-14 text-white shadow-xl">
          <div className="absolute -top-12 -right-12 h-52 w-52 rounded-full bg-white/15 blur-3xl" />
          <div className="absolute -bottom-12 -left-12 h-52 w-52 rounded-full bg-white/15 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                Built for Civic Change
              </div>
              <h1 className="mb-4 text-3xl font-bold leading-tight md:text-5xl">About BolBharat</h1>
              <p className="max-w-2xl text-base text-white/90 md:text-lg">
                BolBharat helps citizens report local civic issues and gives communities a transparent way to track what gets fixed.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button asChild size="lg" className="bg-white text-[#FF7722] hover:bg-white/90">
                  <Link to="/report">Report an Issue</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="border-white/40 bg-white/10 text-white hover:bg-white/20">
                  <Link to="/issues">See Community Issues</Link>
                </Button>
              </div>
            </div>

            <div className="mx-auto w-full max-w-md rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur-sm">
              <img
                src="/logo-hindi.png"
                alt="Bol Bharat"
                className="h-auto w-full rounded-xl bg-white/90 p-4"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="border-[#FF7722]/20 bg-[#FF7722]/5">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-[#FF7722]">24x7</p>
              <p className="mt-2 text-sm text-gray-600">Always-open issue reporting</p>
            </CardContent>
          </Card>
          <Card className="border-[#FF7722]/20 bg-[#FF7722]/5">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-[#FF7722]">10+</p>
              <p className="mt-2 text-sm text-gray-600">Issue categories supported</p>
            </CardContent>
          </Card>
          <Card className="border-[#FF7722]/20 bg-[#FF7722]/5">
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-[#FF7722]">Live</p>
              <p className="mt-2 text-sm text-gray-600">Community issue stream and map view</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-gray-700 mb-4">
              BolBharat bridges the gap between residents and local governance by turning civic frustration into clear, trackable action.
            </p>
            <p className="text-gray-700 mb-4">
              The people who live in a neighborhood are the first to notice broken roads, overflowing garbage, unsafe wiring, and other public issues.
            </p>
            <p className="text-gray-700">
              We make those observations count with structured reporting, transparent status updates, and map-based visibility.
            </p>
          </div>
          <div className="rounded-2xl border bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4">What You Can Do on BolBharat</h3>
            <div className="space-y-3">
              {values.map((value) => (
                <div key={value} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#FF7722]" />
                  <p className="text-gray-700">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Card className="bg-civic-light">
          <CardContent className="pt-6">
            <h2 className="text-2xl font-bold mb-6 text-center">How BolBharat Works</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pillars.map((pillar, index) => (
                <div key={pillar.title} className="text-center">
                  <div className="bg-civic-teal text-white w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">{index + 1}</div>
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-civic-teal shadow-sm">
                    <pillar.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{pillar.title}</h3>
                  <p className="text-gray-700">{pillar.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
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
