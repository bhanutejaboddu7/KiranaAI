import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ error, errorInfo });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="p-4 bg-red-50 min-h-screen flex flex-col items-center justify-center text-red-800">
                    <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
                    <p className="font-mono text-sm bg-white p-4 rounded border border-red-200 overflow-auto max-w-full">
                        {this.state.error && this.state.error.toString()}
                    </p>
                    <p className="mt-4 text-sm text-gray-600">
                        Please take a screenshot and share it with the developer.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                        Reload App
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
