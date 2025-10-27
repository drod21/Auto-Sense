import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Button,
  Card,
  ProgressBar,
  useTheme,
  ActivityIndicator,
} from 'react-native-paper';
import * as DocumentPicker from 'expo-document-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useNavigation } from '@react-navigation/native';

type UploadState = 'idle' | 'uploading' | 'parsing' | 'success';

export default function UploadScreen() {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const theme = useTheme();
  const navigation = useNavigation();

  const uploadMutation = useMutation({
    mutationFn: async (file: { uri: string; name: string; type: string }) => {
      return apiClient.uploadFile('/api/programs/upload', file);
    },
    onSuccess: () => {
      setUploadState('success');
      setTimeout(() => {
        setUploadState('idle');
        setFileName('');
        setProgress(0);
        // Navigate to dashboard
        navigation.navigate('MainTabs', { screen: 'Dashboard' } as any);
      }, 2000);
    },
    onError: (error: Error) => {
      setUploadState('idle');
      Alert.alert('Upload Failed', error.message);
    },
  });

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setFileName(file.name);
      setUploadState('uploading');
      setProgress(0.5);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 0.9) {
            clearInterval(progressInterval);
            return 0.9;
          }
          return prev + 0.1;
        });
      }, 100);

      setProgress(1);
      setUploadState('parsing');

      clearInterval(progressInterval);

      await uploadMutation.mutateAsync({
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
    } catch (error) {
      console.error('Document picker error:', error);
      setUploadState('idle');
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Import Workout Plan
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          Upload your workout spreadsheet and let AI automatically parse exercises, sets, reps,
          RPE, and rest timers.
        </Text>
      </View>

      <View style={styles.content}>
        <Card style={styles.uploadCard}>
          <Card.Content style={styles.uploadContent}>
            {uploadState === 'idle' && (
              <>
                <MaterialCommunityIcons
                  name="cloud-upload-outline"
                  size={64}
                  color={theme.colors.primary}
                />
                <Text variant="titleLarge" style={styles.uploadTitle}>
                  Select a File
                </Text>
                <Text variant="bodyMedium" style={styles.uploadText}>
                  Choose a CSV or Excel file containing your workout program
                </Text>
                <Button
                  mode="contained"
                  onPress={handlePickDocument}
                  style={styles.uploadButton}
                  icon="file-document"
                >
                  Browse Files
                </Button>
                <Text variant="bodySmall" style={styles.supportedFormats}>
                  Supported formats: .csv, .xlsx, .xls
                </Text>
              </>
            )}

            {uploadState === 'uploading' && (
              <>
                <MaterialCommunityIcons
                  name="cloud-upload"
                  size={64}
                  color={theme.colors.primary}
                />
                <Text variant="titleLarge" style={styles.statusTitle}>
                  Uploading...
                </Text>
                <Text variant="bodyMedium" style={styles.fileName}>
                  {fileName}
                </Text>
                <ProgressBar progress={progress} style={styles.progressBar} />
              </>
            )}

            {uploadState === 'parsing' && (
              <>
                <ActivityIndicator size="large" />
                <Text variant="titleLarge" style={styles.statusTitle}>
                  Parsing with AI...
                </Text>
                <Text variant="bodyMedium" style={styles.statusText}>
                  Our AI is analyzing your workout program. This may take a moment.
                </Text>
              </>
            )}

            {uploadState === 'success' && (
              <>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={64}
                  color={theme.colors.primary}
                />
                <Text variant="titleLarge" style={styles.statusTitle}>
                  Success!
                </Text>
                <Text variant="bodyMedium" style={styles.statusText}>
                  Your workout program has been imported successfully.
                </Text>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.infoCard}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.infoTitle}>
              What the AI extracts:
            </Text>
            <View style={styles.featureList}>
              <FeatureItem icon="dumbbell" text="Exercise names and variations" />
              <FeatureItem icon="counter" text="Sets and rep ranges" />
              <FeatureItem icon="gauge" text="RPE (Rate of Perceived Exertion)" />
              <FeatureItem icon="timer-outline" text="Rest timer intervals" />
              <FeatureItem icon="swap-horizontal" text="Substitution options" />
            </View>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  const theme = useTheme();
  return (
    <View style={styles.featureItem}>
      <MaterialCommunityIcons name={icon as any} size={20} color={theme.colors.primary} />
      <Text variant="bodyMedium" style={styles.featureText}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    lineHeight: 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  uploadCard: {
    marginBottom: 16,
  },
  uploadContent: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  uploadTitle: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  uploadText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  uploadButton: {
    marginTop: 24,
  },
  supportedFormats: {
    marginTop: 16,
    color: '#999',
  },
  statusTitle: {
    marginTop: 16,
    fontWeight: 'bold',
  },
  fileName: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  statusText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  progressBar: {
    width: '100%',
    marginTop: 24,
  },
  infoCard: {
    backgroundColor: 'white',
  },
  infoTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
  },
  featureList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    flex: 1,
  },
});
