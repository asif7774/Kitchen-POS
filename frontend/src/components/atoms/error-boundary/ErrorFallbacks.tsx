interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Full-page error fallback — used at the app root level.
 * Shown when the entire application crashes.
 */
export const AppErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
    <div className="max-w-md w-full text-center">
      <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <span className="text-red-600 text-3xl" aria-hidden="true">!</span>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">
        Application Error
      </h1>
      <p className="text-gray-600 mb-6">
        The application encountered an unexpected error and cannot continue.
      </p>
      {import.meta.env.DEV && (
        <details className="mb-6 text-left bg-red-50 border border-red-200 rounded-lg p-4">
          <summary className="text-sm font-medium text-red-800 cursor-pointer">
            Error Details (dev only)
          </summary>
          <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap wrap-break-word">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={resetErrorBoundary}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
        >
          Try Again
        </button>
        <button
          onClick={() => { window.location.href = '/'; }}
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 font-medium"
        >
          Go Home
        </button>
      </div>
    </div>
  </div>
);

/**
 * Page-level error fallback — used around individual routes.
 * Shown when a specific page fails to load or render.
 */
export const PageErrorFallback = ({ error, resetErrorBoundary }: ErrorFallbackProps) => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
    <div className="max-w-md w-full text-center">
      <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-yellow-600 text-2xl" aria-hidden="true">⚠</span>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">
        Page Load Error
      </h2>
      <p className="text-gray-600 mb-4">
        This page couldn&apos;t be loaded. Please try again or navigate to a different page.
      </p>
      {import.meta.env.DEV && (
        <p className="text-sm text-red-600 bg-red-50 rounded-md p-3 mb-4 text-left wrap-break-word">
          {error.message}
        </p>
      )}
      <button
        onClick={resetErrorBoundary}
        className="px-5 py-2.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
      >
        Reload Page
      </button>
    </div>
  </div>
);

/**
 * Widget-level error fallback — used around individual components/features.
 * Shown when a specific section of a page fails.
 */
export const WidgetErrorFallback = ({ resetErrorBoundary }: ErrorFallbackProps) => (
  <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
    <p className="text-sm text-gray-600 mb-3">
      This section couldn&apos;t load.
    </p>
    <button
      onClick={resetErrorBoundary}
      className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
    >
      Retry
    </button>
  </div>
);
