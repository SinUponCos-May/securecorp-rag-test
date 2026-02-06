// Dynamic Comment System for RAG Testing
// Stores comments in Firebase Firestore with real-time updates

class CommentSystem {
    constructor() {
        this.db = window.firebaseDB;
        this.commentsCollection = 'comments';
        this.commentsLimit = 50;
        this.unsubscribe = null;
        this.currentFilter = 'all';
        
        // Initialize when DOM is ready
        document.addEventListener('DOMContentLoaded', () => {
            this.init();
        });
    }
    
    async init() {
        if (!this.db) {
            console.error('❌ Firebase not initialized');
            this.showError('Firebase connection failed. Please refresh.');
            return;
        }
        
        // Setup form submission
        this.setupForm();
        
        // Load initial comments
        this.loadComments();
        
        // Setup real-time listener
        this.setupRealTimeListener();
        
        // Setup filters
        this.setupFilters();
        
        // Update URLs in documentation
        this.updateSiteUrls();
        
        console.log('✅ Comment system initialized');
    }
    
    setupForm() {
        const form = document.getElementById('commentForm');
        const textarea = document.getElementById('commentText');
        const charCount = document.getElementById('charCount');
        
        if (!form || !textarea) return;
        
        // Character counter
        textarea.addEventListener('input', () => {
            const count = textarea.value.length;
            charCount.textContent = count;
            charCount.style.color = count > 500 ? '#d32f2f' : '#666';
        });
        
        // Form submission
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('commentName').value.trim();
            const email = document.getElementById('commentEmail').value.trim();
            const text = textarea.value.trim();
            const isTest = document.getElementById('isTestComment')?.checked || false;
            
            if (!name || !text) {
                this.showNotification('Please fill in all required fields', 'error');
                return;
            }
            
            if (text.length > 500) {
                this.showNotification('Comment must be 500 characters or less', 'error');
                return;
            }
            
            await this.submitComment({
                name,
                email: email || null,
                text,
                isTest,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString()
            });
            
            // Reset form
            form.reset();
            charCount.textContent = '0';
        });
    }
    
    async submitComment(commentData) {
        const submitBtn = document.getElementById('submitBtn');
        const originalText = submitBtn.querySelector('.btn-text').textContent;
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            submitBtn.querySelector('.btn-text').textContent = 'Posting...';
            submitBtn.querySelector('.spinner').classList.remove('hidden');
            
            // Get user IP (optional)
            const ip = await this.getUserIP();
            
            // Prepare comment for Firestore
            const comment = {
                name: commentData.name,
                email: commentData.email,
                text: commentData.text,
                isAttack: commentData.isTest,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ip: ip,
                userAgent: commentData.userAgent,
                testId: 'BC-2024-RAG-004',
                category: commentData.isTest ? 'test_comment' : 'user_comment'
            };
            
            // Add to Firestore
            const docRef = await this.db.collection(this.commentsCollection).add(comment);
            
            this.showNotification('Comment posted successfully!', 'success');
            console.log('✅ Comment added with ID:', docRef.id);
            
            return { success: true, id: docRef.id };
            
        } catch (error) {
            console.error('❌ Error posting comment:', error);
            this.showNotification('Failed to post comment. Please try again.', 'error');
            return { success: false, error: error.message };
            
        } finally {
            // Restore button state
            submitBtn.disabled = false;
            submitBtn.querySelector('.btn-text').textContent = originalText;
            submitBtn.querySelector('.spinner').classList.add('hidden');
        }
    }
    
    async loadComments() {
        try {
            const snapshot = await this.db.collection(this.commentsCollection)
                .orderBy('timestamp', 'desc')
                .limit(this.commentsLimit)
                .get();
            
            this.displayComments(snapshot);
            
        } catch (error) {
            console.error('❌ Error loading comments:', error);
            this.showError('Failed to load comments. Please refresh.');
        }
    }
    
    setupRealTimeListener() {
        if (!this.db) return;
        
        // Subscribe to real-time updates
        this.unsubscribe = this.db.collection(this.commentsCollection)
            .orderBy('timestamp', 'desc')
            .limit(this.commentsLimit)
            .onSnapshot(snapshot => {
                this.displayComments(snapshot);
                this.updateCommentStats(snapshot.size);
            }, error => {
                console.error('❌ Real-time listener error:', error);
            });
    }
    
    displayComments(snapshot) {
        const container = document.getElementById('commentsList');
        if (!container) return;
        
        if (snapshot.empty) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💬</div>
                    <h4>No comments yet</h4>
                    <p>Be the first to share your thoughts!</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        snapshot.forEach(doc => {
            const data = doc.data();
            const commentId = doc.id;
            const timestamp = data.timestamp ? 
                this.formatTimestamp(data.timestamp.toDate()) : 'Just now';
            
            const isAttack = data.isAttack || false;
            const category = data.category || 'user_comment';
            const email = data.email ? `<small class="comment-email">${data.email}</small>` : '';
            
            html += `
                <div class="comment-item ${isAttack ? 'attack' : ''}" data-category="${category}" id="comment-${commentId}">
                    <div class="comment-header">
                        <div class="comment-meta">
                            <strong class="comment-name">${data.name}</strong>
                            ${email}
                            ${isAttack ? '<span class="attack-badge">TEST</span>' : ''}
                        </div>
                        <span class="comment-time">${timestamp}</span>
                    </div>
                    <div class="comment-body">${this.escapeHtml(data.text)}</div>
                    <div class="comment-footer">
                        <span class="comment-category">${category}</span>
                        <button class="delete-btn" onclick="commentSystem.deleteComment('${commentId}')" title="Delete comment">×</button>
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Apply filter
        this.applyFilter(this.currentFilter);
    }
    
    applyFilter(filter) {
        this.currentFilter = filter;
        const items = document.querySelectorAll('.comment-item');
        
        items.forEach(item => {
            const category = item.getAttribute('data-category');
            const isAttack = item.classList.contains('attack');
            
            switch(filter) {
                case 'all':
                    item.style.display = 'block';
                    break;
                case 'test':
                    item.style.display = isAttack ? 'block' : 'none';
                    break;
                case 'user':
                    item.style.display = !isAttack ? 'block' : 'none';
                    break;
                default:
                    item.style.display = 'block';
            }
        });
    }
    
    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterButtons.forEach(b => b.classList.remove('active'));
                // Add active class to clicked button
                btn.classList.add('active');
                // Apply filter
                const filter = btn.getAttribute('data-filter');
                this.applyFilter(filter);
            });
        });
    }
    
    async deleteComment(commentId) {
        if (!confirm('Delete this comment?')) return;
        
        try {
            await this.db.collection(this.commentsCollection).doc(commentId).delete();
            this.showNotification('Comment deleted', 'success');
        } catch (error) {
            console.error('❌ Error deleting comment:', error);
            this.showNotification('Failed to delete comment', 'error');
        }
    }
    
    async clearAllComments() {
        if (!confirm('⚠️ Delete ALL comments? This cannot be undone.')) return;
        
        const clearBtn = document.getElementById('clearBtn');
        const originalText = clearBtn.textContent;
        
        try {
            clearBtn.disabled = true;
            clearBtn.textContent = 'Clearing...';
            
            const snapshot = await this.db.collection(this.commentsCollection).get();
            const batch = this.db.batch();
            
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            await batch.commit();
            this.showNotification(`Cleared ${snapshot.size} comments`, 'success');
            
        } catch (error) {
            console.error('❌ Error clearing comments:', error);
            this.showNotification('Failed to clear comments', 'error');
        } finally {
            clearBtn.disabled = false;
            clearBtn.textContent = originalText;
        }
    }
    
    updateCommentStats(count) {
        const totalSpan = document.getElementById('totalComments');
        if (totalSpan) totalSpan.textContent = count;
    }
    
    updateSiteUrls() {
        const siteUrl = `https://${window.location.hostname}`;
        const sitemapUrl = `${siteUrl}/sitemap.xml`;
        
        document.getElementById('siteUrl').textContent = siteUrl;
        document.getElementById('sitemapUrl').textContent = sitemapUrl;
        
        // Update page title with actual URL
        document.title = `SecureCorp RAG Test | ${siteUrl}`;
    }
    
    async getUserIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
    }
    
    formatTimestamp(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML.replace(/\n/g, '<br>');
    }
    
    showNotification(message, type = 'info') {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(el => el.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
    
    showError(message) {
        const container = document.getElementById('commentsList');
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <div class="error-icon">⚠️</div>
                    <h4>Connection Error</h4>
                    <p>${message}</p>
                    <button class="btn btn-small" onclick="commentSystem.loadComments()">Retry</button>
                </div>
            `;
        }
    }
    
    refreshComments() {
        this.loadComments();
        this.showNotification('Comments refreshed', 'info');
    }
}

// Initialize comment system
const commentSystem = new CommentSystem();
window.commentSystem = commentSystem;
window.refreshComments = () => commentSystem.refreshComments();
window.clearAllComments = () => commentSystem.clearAllComments();