import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Cập nhật state để hiển thị giao diện thay thế
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Ghi log lỗi
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Giao diện Fallback (Hiển thị khi có lỗi)
      return (
        <div style={styles.container}>
          <div style={styles.card}>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.text}>
              The application encountered an unexpected error.
            </p>
            
            {this.state.error && (
              <details style={styles.details}>
                <summary>Error Details</summary>
                <pre style={styles.pre}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <button onClick={this.handleReload} style={styles.button}>
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f3f4f6',
    fontFamily: 'sans-serif',
  },
  card: {
    backgroundColor: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    maxWidth: '500px',
    width: '90%',
    textAlign: 'center',
  },
  title: {
    color: '#ef4444',
    marginTop: 0,
  },
  text: {
    color: '#4b5563',
    marginBottom: '20px',
  },
  details: {
    textAlign: 'left',
    marginBottom: '20px',
    backgroundColor: '#f9fafb',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #e5e7eb',
    color: '#dc2626',
    fontSize: '0.9em',
  },
  pre: {
    marginTop: '10px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
  },
  button: {
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
  }
};

// --- QUAN TRỌNG NHẤT LÀ DÒNG NÀY ---
export default ErrorBoundary;