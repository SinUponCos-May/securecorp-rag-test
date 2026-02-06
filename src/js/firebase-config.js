// Firebase Configuration (Updated during build)
const firebaseConfig = {
    apiKey: "AIzaSyCozbLpGXsn2rObC5v1ikOT7DErUPS3JUM",
    authDomain: "rag-security-1.firebaseapp.com",
    projectId: "rag-security-1",
    storageBucket: "rag-security-1.firebasestorage.app",
    messagingSenderId: "1038765695326",
    appId: "1:1038765695326:web:de114e70c102f21cb6afcf"
};

// Initialize Firebase
let db;
let isFirebaseInitialized = false;

try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    isFirebaseInitialized = true;
    
    // Enable offline persistence
    db.enablePersistence()
        .then(() => {
            console.log('✅ Firebase persistence enabled');
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.log('⚠️ Multiple tabs open, persistence can only be enabled in one tab');
            } else if (err.code === 'unimplemented') {
                console.log('⚠️ Browser doesn\'t support persistence');
            }
        });
    
    console.log('✅ Firebase initialized successfully');
    
    // Test connection
    db.collection('connection_test').doc('test').set({
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        testId: 'BC-2024-RAG-004'
    }, { merge: true }).then(() => {
        console.log('✅ Firebase connection test passed');
    }).catch(error => {
        console.error('❌ Firebase connection test failed:', error);
    });
    
} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    alert('Firebase initialization failed. Please check your configuration.');
}

// Export Firebase services
window.firebaseDB = db;
window.isFirebaseReady = isFirebaseInitialized;