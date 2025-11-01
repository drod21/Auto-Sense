import { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, ActivityIndicator, Portal, Modal, Button } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { API_BASE_URL } from '../lib/api';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const webViewRef = useRef<WebView>(null);

  const handleLogin = () => {
    setShowWebView(true);
    setIsLoading(true);
  };

  const handleNavigationStateChange = (navState: any) => {
    // Hide loading indicator once page starts loading
    if (navState.loading) {
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }

    // Check if we've successfully logged in by detecting redirect to home page
    if (navState.url.includes(API_BASE_URL) && navState.url.endsWith('/')) {
      // Login successful, close WebView and notify parent
      setShowWebView(false);
      onLoginSuccess();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="displaySmall" style={styles.title}>
          Workout Tracker
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Track your workouts with AI-powered program planning
        </Text>

        <Button 
          mode="contained" 
          onPress={handleLogin}
          style={styles.loginButton}
          contentStyle={styles.loginButtonContent}
        >
          Login with Replit
        </Button>

        <Text variant="bodySmall" style={styles.note}>
          Secure authentication powered by Replit
        </Text>
      </View>

      <Portal>
        <Modal
          visible={showWebView}
          onDismiss={() => setShowWebView(false)}
          contentContainerStyle={styles.modalContainer}
        >
          <View style={styles.webViewContainer}>
            <View style={styles.webViewHeader}>
              <Text variant="titleMedium">Sign In</Text>
              <Button onPress={() => setShowWebView(false)}>Cancel</Button>
            </View>

            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" />
              </View>
            )}

            <WebView
              ref={webViewRef}
              source={{ uri: `${API_BASE_URL}/api/login` }}
              onNavigationStateChange={handleNavigationStateChange}
              onLoadStart={() => setIsLoading(true)}
              onLoadEnd={() => setIsLoading(false)}
              style={styles.webView}
              sharedCookiesEnabled={true}
              thirdPartyCookiesEnabled={true}
            />
          </View>
        </Modal>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    marginBottom: 48,
    textAlign: 'center',
    color: '#666',
  },
  loginButton: {
    marginBottom: 16,
    minWidth: 250,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  note: {
    textAlign: 'center',
    color: '#999',
  },
  modalContainer: {
    flex: 1,
    margin: 0,
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  webViewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  webView: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 999,
  },
});
