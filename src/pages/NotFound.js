import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@material-tailwind/react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 text-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-9xl font-bold text-indigo-600 dark:text-indigo-400">404</div>
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
          Page Not Found
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Oops! The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="pt-6">
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/')}
            className="px-6 py-3 text-lg"
          >
            Go Back Home
          </Button>
        </div>
        <div className="pt-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? <a href="/contact" className="text-indigo-600 dark:text-indigo-400 hover:underline">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;