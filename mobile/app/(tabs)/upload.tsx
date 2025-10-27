import { useMemo } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { API_BASE_URL } from '@/src/lib/queryClient';

const SAMPLE_TEMPLATE_PATH = '/static/sample-program.xlsx';

export default function UploadScreen() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const buttonBackgroundColor = theme.tint;
  const buttonLabelColor = isColorLight(buttonBackgroundColor) ? '#11181C' : '#fff';

  const sampleTemplateUrl = useMemo(() => {
    if (/^https?:\/\//i.test(SAMPLE_TEMPLATE_PATH)) {
      return SAMPLE_TEMPLATE_PATH;
    }
    return `${API_BASE_URL}${SAMPLE_TEMPLATE_PATH}`.replace(/([^:]\/)\/+/g, '$1');
  }, []);

  const handleOpenTemplate = () => {
    Linking.openURL(sampleTemplateUrl).catch(() => {
      Alert.alert(
        'Download unavailable',
        'We could not open the sample template. Please download it from the desktop app.',
      );
    });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentInsetAdjustmentBehavior="automatic">
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Upload Program</Text>
        <Text style={[styles.subtitle, { color: theme.icon }]}>
          Import your spreadsheet on desktop, then review and log workouts on your phone.
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>How uploads work</Text>
          <Text style={[styles.cardText, { color: theme.icon }]}>
            Uploading spreadsheets directly from mobile is not supported yet. Use the web app to
            import new programs. Once uploaded, they will appear here automatically.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Need a template?</Text>
          <Text style={[styles.cardText, { color: theme.icon }]}>
            Start from our example spreadsheet to ensure exercises, sets, and notes are parsed
            correctly.
          </Text>
          <TouchableOpacity
            onPress={handleOpenTemplate}
            style={[styles.button, { backgroundColor: buttonBackgroundColor }]}>
            <Text style={[styles.buttonLabel, { color: buttonLabelColor }]}>
              Download Sample Spreadsheet
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 36,
    paddingBottom: 16,
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 36,
    gap: 20,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    backgroundColor: 'rgba(17, 24, 28, 0.03)',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  cardText: {
    fontSize: 15,
    lineHeight: 22,
  },
  button: {
    marginTop: 4,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});

function isColorLight(color: string) {
  if (!color || color === 'transparent') {
    return false;
  }

  if (!color.startsWith('#')) {
    return false;
  }

  let hex = color.slice(1);
  if (hex.length === 3) {
    hex = hex
      .split('')
      .map((char) => char + char)
      .join('');
  }

  if (hex.length !== 6) {
    return false;
  }

  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;

  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.7;
}
