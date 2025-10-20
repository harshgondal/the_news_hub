import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ 
  message = 'Something went wrong', 
  onRetry 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 max-w-md">
        <div className="flex items-center mb-4">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 mr-2" />
          <h3 className="text-lg font-semibold text-red-900 dark:text-red-200">Error</h3>
        </div>
        <p className="text-red-700 dark:text-red-300 mb-4">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="btn-primary w-full"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;
