
import PageLayout from "@/components/Layout/PageLayout";
import IssuesList from "@/components/Issues/IssuesList";
import { mockIssues } from "@/data/mockData";
import { Megaphone, Filter, Search } from "lucide-react";

const IssuesPage = () => {
  return (
    <PageLayout>
      <div className="civic-container py-8">
        {/* Hero Header */}
        <div className="mb-10 bg-gradient-to-br from-[#FF7722] via-[#FF8844] to-[#FF9F5A] p-8 md:p-12 rounded-2xl text-white relative overflow-hidden shadow-xl">
          {/* Background decorations */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
              <img 
                src="/lovable-uploads/8316e3e4-2d31-4954-9239-ca4fa46be0cc.png" 
                alt="BOL BHARAT Logo" 
                className="h-20 w-20" 
              />
            </div>
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-3">
                <Megaphone className="h-4 w-4" />
                <span className="text-sm font-medium">Community Issues</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-3">BOL BHARAT Issues</h1>
              <p className="text-white/90 text-lg max-w-2xl">
                Browse and filter reported issues across India. Use the filters below to find issues in your area.
              </p>
            </div>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Issues', value: mockIssues.length, color: 'bg-blue-50 text-blue-600' },
            { label: 'Reported', value: mockIssues.filter(i => i.status === 'reported').length, color: 'bg-amber-50 text-amber-600' },
            { label: 'In Progress', value: mockIssues.filter(i => i.status === 'in-progress').length, color: 'bg-purple-50 text-purple-600' },
            { label: 'Resolved', value: mockIssues.filter(i => i.status === 'resolved').length, color: 'bg-green-50 text-green-600' },
          ].map((stat, index) => (
            <div key={index} className={`${stat.color} rounded-xl p-4 text-center transition-transform hover:scale-105 cursor-default`}>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-sm opacity-80">{stat.label}</div>
            </div>
          ))}
        </div>
        
        <IssuesList issues={mockIssues} />
      </div>
    </PageLayout>
  );
};

export default IssuesPage;
