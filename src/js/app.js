// Main Application Script
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔒 SecureCorp RAG Test Site loaded');
    
    // Update current year in footer
    const yearSpan = document.querySelector('.copyright');
    if (yearSpan) {
        yearSpan.textContent = yearSpan.textContent.replace('2024', new Date().getFullYear());
    }
    
    // Initialize live indicator animation
    const liveIndicator = document.querySelector('.live-indicator');
    if (liveIndicator) {
        setInterval(() => {
            liveIndicator.style.opacity = liveIndicator.style.opacity === '0.5' ? '1' : '0.5';
        }, 1000);
    }
    
    // Add CSS for notifications
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            background: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        }
        
        .notification-success {
            border-left: 4px solid #4CAF50;
        }
        
        .notification-error {
            border-left: 4px solid #f44336;
        }
        
        .notification-info {
            border-left: 4px solid #2196F3;
        }
        
        .notification-warning {
            border-left: 4px solid #ff9800;
        }
        
        .notification-close {
            background: none;
            border: none;
            font-size: 20px;
            cursor: pointer;
            color: #666;
            margin-left: auto;
        }
        
        .hidden {
            display: none !important;
        }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .attack-notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            background: #fff0f0;
            border-left: 4px solid #f44336;
            padding: 15px;
            border-radius: 6px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 9999;
        }
        
        .loading-state {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .loading-state .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .empty-state, .error-state {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .empty-icon, .error-icon {
            font-size: 48px;
            margin-bottom: 20px;
        }
    `;
    document.head.appendChild(style);
    
    // Check Firebase connection
    setTimeout(() => {
        if (!window.isFirebaseReady) {
            console.warn('⚠️ Firebase not initialized');
            const commentsList = document.getElementById('commentsList');
            if (commentsList) {
                commentsList.innerHTML = `
                    <div class="error-state">
                        <div class="error-icon">⚠️</div>
                        <h4>Firebase Connection Error</h4>
                        <p>Unable to connect to Firebase. Please check your configuration.</p>
                        <button class="btn btn-small" onclick="location.reload()">Retry</button>
                    </div>
                `;
            }
        }
    }, 3000);
});