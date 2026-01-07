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
        this.setState({
            error: error,
            errorInfo: errorInfo
        });
        console.error("Uncaught error:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#721c24', backgroundColor: '#f8d7da', margin: '2rem', borderRadius: '8px' }}>
                    <h2>عذراً، حدث خطأ غير متوقع.</h2>
                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', textAlign: 'left', direction: 'ltr' }}>
                        {this.state.error && this.state.error.toString()}
                        <br />
                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
                    >
                        إعادة تحميل الصفحة
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
