import React from 'react';

const FloatingButton = () => {
  return (
    <div className="fixed bottom-52 right-20">
      <button className="bg-blue-500 text-white p-6 rounded-full shadow-lg hover:bg-blue-700 transition duration-300">
        Add
      </button>
    </div>
  );
};

export default FloatingButton;