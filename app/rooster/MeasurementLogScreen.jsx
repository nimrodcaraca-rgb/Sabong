import React from 'react';
import { View, Text } from 'react-native';

export default function DashboardScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0A0A0A', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#D4AF37', fontSize: 22, fontWeight: 'bold' }}>Dashboard</Text>
    </View>
  );
}