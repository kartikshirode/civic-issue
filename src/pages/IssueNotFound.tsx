import { useNavigate } from 'react-router-dom';

const IssueNotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="text-center py-12">
      <h1 className="text-2xl font-bold text-gray-800">Issue Not Found</h1>
      <p className="text-gray-600 mt-4">The issue you're looking for doesn't exist or has been removed.</p>
      <button
        onClick={() => navigate('/issues')}
        className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Back to Issues
      </button>
    </div>
  );
};

export default IssueNotFound;