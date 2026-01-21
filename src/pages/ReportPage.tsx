
import PageLayout from "@/components/Layout/PageLayout";
import ReportForm from "@/components/ReportForm/ReportForm";

const ReportPage = () => {
  return (
    <PageLayout>
      <div className="civic-container py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Report an Issue - BOL BHARAT</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Fill out the form below to report a civic issue in your community. Your report will help local authorities address the problem.
          </p>
        </div>
        
        <ReportForm />
      </div>
    </PageLayout>
  );
};

export default ReportPage;
