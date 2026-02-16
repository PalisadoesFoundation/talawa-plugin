import React from 'react';

interface LoadingStateProps {
  isLoading: boolean;
  variant: string;
  children: React.ReactNode;
}

/**
 * Placeholder LoadingState component for standalone/development mode.
 * When installed as a plugin, the real implementation is imported from the host application.
 */
const LoadingState: React.FC<LoadingStateProps> = () => <div>Loading...</div>;

export default LoadingState;
