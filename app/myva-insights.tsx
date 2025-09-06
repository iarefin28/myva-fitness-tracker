import { LinearGradient } from 'expo-linear-gradient';
import { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native';
import ExportTemplatesButton from "../components/ExportTemplatesButton";



export default function MyvaInsightsScreen() {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'proPlus'>('pro');
  const swipeableRef = useRef(null);
  const [cardVisible, setCardVisible] = useState(true);

  const scheme = useColorScheme();
  const isDark = scheme === "dark";

  const backgroundColor = isDark ? "#0e0e0e" : "#ffffff";
  const textColor = isDark ? "#ffffff" : "#000000";
  const secondaryText = isDark ? "#cfcfcf" : "#444444";
  const cardBg = isDark ? "#1a1a1a" : "#f2f2f2";
  const dividerColor = isDark ? "#333" : "#ccc";
  const toggleBg = isDark ? "#1a1a1a" : "#e8e8e8";

  const handleSwipeOpen = () => {
    setCardVisible(false);
  };

  const renderRightActions = () => (
    <TouchableOpacity
      style={{
        backgroundColor: 'red',
        justifyContent: 'center',
        alignItems: 'center',
        width: 100,
        height: '100%',
        borderRadius: 16,
      }}
      onPress={() => setCardVisible(false)}
    >
      <Text style={{ color: 'white', fontWeight: 'bold' }}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor }]}>

      {/* Full-Width Top Toggle */}
      <View style={styles.topToggleContainer}>
        <TouchableOpacity
          style={[
            styles.topToggleButton,
            { backgroundColor: toggleBg },
            selectedPlan === 'pro' && styles.topToggleSelectedLeft,
          ]}
          onPress={() => setSelectedPlan('pro')}
        >
          <Text style={styles.topToggleText}>Pro</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.topToggleButton,
            { backgroundColor: toggleBg },
            selectedPlan === 'proPlus' && styles.topToggleSelectedRight,
          ]}
          onPress={() => setSelectedPlan('proPlus')}
        >
          <Text style={styles.topToggleText}>Pro+</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Gradient Card */}
      {selectedPlan === 'pro' ? (
        <LinearGradient
          colors={['#00ffc6', '#003c33']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.proCard}
        >
          <Text style={styles.proText}>MYVA Pro</Text>
          <Text style={styles.cardSubtitle}>
            Get weekly insights & AI tips to optimize your training.
          </Text>
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={['#ffe566', '#aa5000']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.proCard}
        >
          <Text style={styles.proText}>MYVA Pro+</Text>
          <Text style={styles.cardSubtitle}>
            Unlock deep performance analytics, smart scheduling & elite coaching.
          </Text>
        </LinearGradient>
      )}

      {/* Description */}
      <Text style={[styles.title, { color: textColor }]}>MYVA Insights</Text>
      <Text style={[styles.description, { color: secondaryText }]}>
        Powered by advanced AI, MYVA Insights is your personal fitness analyst. It studies your workouts, trends, and progress to offer:
      </Text>

      {/* Feature List */}
      <View style={[styles.cardGroup, { backgroundColor: cardBg, borderColor: dividerColor }]}>
        <View style={{ position: "absolute", right: 16, bottom: 24 }}>
          <ExportTemplatesButton storageKey="savedTemplates" />
        </View>

        <View style={styles.infoCard}>
          <Text style={[styles.cardText, { color: textColor }]}>Weekly performance breakdowns</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        <View style={styles.infoCard}>
          <Text style={[styles.cardText, { color: textColor }]}>Muscle group workload summaries</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        <View style={styles.infoCard}>
          <Text style={[styles.cardText, { color: textColor }]}>AI-generated recommendations</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        <View style={styles.infoCard}>
          <Text style={[styles.cardText, { color: textColor }]}>Recovery suggestions & volume warnings</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        <View style={styles.infoCard}>
          <Text style={[styles.cardText, { color: textColor }]}>Smart insights tailored to your goals</Text>
        </View>
      </View>

      <Text style={styles.comingSoon}>
        {selectedPlan === 'pro' ? 'Included in MYVA Pro 🚀' : 'Included in MYVA Pro+ 🔥'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0e0e0e',
    alignItems: 'center',
  },
  topToggleContainer: {
    flexDirection: 'row',
    width: '100%',
    height: 50,
  },
  topToggleButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 1,
    borderColor: '#333',
  },
  topToggleSelectedLeft: {
    backgroundColor: '#00ffc6',
  },
  topToggleSelectedRight: {
    backgroundColor: '#ffd700',
  },
  topToggleText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  proCard: {
    width: '95%',
    height: 100,
    borderRadius: 18,
    marginTop: 30,
    marginBottom: 20,
    padding: 16,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  proText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff', // 🔥 white text
  },
  cardSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff', // 🔥 white text
    opacity: 0.9,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#cfcfcf',
    marginHorizontal: 24,
    marginBottom: 20,
  },
  bulletContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginBottom: 30,
  },
  bullet: {
    fontSize: 15,
    color: '#b0f0e6',
    marginVertical: 4,
  },
  comingSoon: {
    fontSize: 16,
    color: '#ffaa00',
    fontWeight: '600',
    marginTop: 30,
  },
  cardGroup: {
    width: '92%',
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 30,
    borderColor: '#333',
    borderWidth: 1,
  },
  infoCard: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginHorizontal: 16,
  },
  cardText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
  },
});