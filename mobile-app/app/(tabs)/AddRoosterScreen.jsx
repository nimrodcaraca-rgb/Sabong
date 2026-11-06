import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Alert, ActivityIndicator, Image, Platform,
  Modal, FlatList
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { usePens } from '../../hooks/usePens';
import { COLORS, BLOODLINES } from '../../constants/theme';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { cacheKeys, updateCacheArray } from '../../lib/offlineStore';
import { createQueueItem, enqueueItem } from '../../lib/offlineQueue';
import { uploadPhotoToSupabase } from '../../lib/uploadPhoto';

export default function AddRoosterScreen({ navigation }) {
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  const { pens, createPen } = usePens();
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState('');
  const [bloodline, setBloodline] = useState('');
  const [breeder, setBreeder] = useState('');
  const [pedigreeNotes, setPedigreeNotes] = useState('');
  const [birthdate, setBirthdate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [showBloodlineList, setShowBloodlineList] = useState(false);

  const [selectedPen, setSelectedPen] = useState(null);
  const [showPenModal, setShowPenModal] = useState(false);
  const [showNewPenForm, setShowNewPenForm] = useState(false);
  const [newPenName, setNewPenName] = useState('');
  const [newPenLocation, setNewPenLocation] = useState('');

  const resetForm = () => {
    setName('');
    setBloodline('');
    setBreeder('');
    setPedigreeNotes('');
    setBirthdate(null);
    setPhoto(null);
    setSelectedPen(null);
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload a rooster photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const uploadPhoto = async () => {
    if (!photo) return null;
    try {
      return await uploadPhotoToSupabase(user.id, photo);
    } catch (err) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
      return null;
    }
  };

  const handleCreatePen = async () => {
    if (!newPenName.trim()) {
      Alert.alert('Error', 'Pen name is required');
      return;
    }
    const { data, error } = await createPen(newPenName, newPenLocation, '');
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSelectedPen(data);
      setShowNewPenForm(false);
      setNewPenName('');
      setNewPenLocation('');
      setShowPenModal(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', "Please enter the rooster's name.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        pen_id: selectedPen?.id || null,
        name: name.trim(),
        bloodline: bloodline || null,
        birthdate: birthdate ? birthdate.toISOString().split('T')[0] : null,
        breeder: breeder.trim() || null,
        pedigree_notes: pedigreeNotes.trim() || null,
      };

      if (!isOnline) {
        const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const pendingRooster = {
          id: localId,
          user_id: user.id,
          ...payload,
          photo_url: photo || null,
          pens: selectedPen ? { id: selectedPen.id, name: selectedPen.name } : null,
          fight_records: [],
          measurement_logs: [],
          health_logs: [],
          is_active: true,
          is_pending: true,
        };

        await enqueueItem(createQueueItem('rooster:create', {
          localId,
          ...payload,
          photoLocalUri: photo || null,
        }));
        await updateCacheArray(cacheKeys.roosters(user.id), (items) => [pendingRooster, ...items]);

        Alert.alert('Saved Offline', 'Rooster saved locally and will sync when online.', [
          { text: 'OK', onPress: () => navigation.navigate('Roosters') }
        ]);
        resetForm();
        return;
      }

      const photoUrl = await uploadPhoto();
      const { data, error } = await supabase
        .from('roosters')
        .insert({
          user_id: user.id,
          ...payload,
          photo_url: photoUrl,
          is_active: true,
        })
        .select(`
          *,
          pens (id, name),
          fight_records (result),
          measurement_logs (weight_kg, logged_at),
          health_logs (logged_at, symptoms, notes)
        `)
        .single();
      if (error) throw error;
      await updateCacheArray(cacheKeys.roosters(user.id), (items) => [data, ...items]);

      Alert.alert('Rooster Added', `${name} has been added to your stable.`, [
        { text: 'View Roosters', onPress: () => navigation.navigate('Roosters') },
        {
          text: 'Add Another',
          onPress: () => {
            resetForm();
          },
        },
      ]);
    } catch (err) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = birthdate
    ? birthdate.toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  const agePreview = () => {
    if (!birthdate) return null;
    const now = new Date();
    const months = (now.getFullYear() - birthdate.getFullYear()) * 12
      + (now.getMonth() - birthdate.getMonth());
    if (months < 12) return `${months} months old`;
    const years = Math.floor(months / 12);
    const rem = months % 12;
    return rem > 0 ? `${years}y ${rem}mo old` : `${years} years old`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.black }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 60 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={18} color={COLORS.textmuted} />
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>Add Rooster</Text>
            <Text style={styles.headerSub}>Register a new rooster to your stable</Text>
          </View>
        </View>

        {/* ── Photo Upload ── */}
        <View style={styles.photoSection}>
          <TouchableOpacity style={styles.photoBtn} onPress={pickPhoto} activeOpacity={0.8}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photoPreview} />
            ) : (
              <View style={styles.photoEmpty}>
                <View style={styles.photoIconWrap}>
                  <Feather name="camera" size={26} color={COLORS.gold} />
                </View>
                <Text style={styles.photoEmptyTitle}>Upload Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          {photo && (
            <TouchableOpacity onPress={() => setPhoto(null)} style={styles.removePhoto}>
              <Feather name="x" size={13} color="#EF4444" />
              <Text style={styles.removePhotoText}>Remove Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.form}>

          {/* ── Section: Identity ── */}
          <View style={styles.sectionHeader}>
            <Image
              source={require('../../assets/sabong_favicon.png')}
              style={{
                width: 14,
                height: 14,
                tintColor: COLORS.gold,
              }}
              resizeMode="contain"
            />
            <Text style={styles.sectionTitle}>IDENTITY</Text>
          </View>

          <FieldLabel label="Rooster Name" required />
          <TextInput
            style={styles.input}
            placeholder="e.g. El Diablo"
            placeholderTextColor={COLORS.textmuted}
            value={name}
            onChangeText={setName}
          />

          <FieldLabel label="Bloodline" />
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowBloodlineList(!showBloodlineList)}
          >
            <Text style={bloodline ? styles.dropdownSelected : styles.dropdownPlaceholder}>
              {bloodline || 'Select bloodline...'}
            </Text>
            <Feather
              name={showBloodlineList ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={COLORS.textmuted}
            />
          </TouchableOpacity>
          {showBloodlineList && (
            <View style={styles.dropdownList}>
              {BLOODLINES.map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.dropdownItem, bloodline === b && styles.dropdownItemActive]}
                  onPress={() => { setBloodline(b); setShowBloodlineList(false); }}
                >
                  <Text style={[styles.dropdownItemText, bloodline === b && { color: COLORS.gold }]}>
                    {b}
                  </Text>
                  {bloodline === b && (
                    <Feather name="check" size={14} color={COLORS.gold} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ── Section: Details ── */}
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <Ionicons name="information-circle-outline" size={14} color={COLORS.gold} />
            <Text style={styles.sectionTitle}>DETAILS</Text>
          </View>

          <FieldLabel label="Birthdate" />
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={birthdate ? styles.dropdownSelected : styles.dropdownPlaceholder}>
              {formattedDate || 'Select birthdate...'}
            </Text>
            <Ionicons name="calendar-outline" size={16} color={COLORS.textmuted} />
          </TouchableOpacity>
          {birthdate && (
            <View style={styles.agePreviewRow}>
              <Ionicons name="time-outline" size={12} color={COLORS.gold} />
              <Text style={styles.agePreview}>{agePreview()}</Text>
            </View>
          )}
          {showDatePicker && (
            <DateTimePicker
              value={birthdate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              maximumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selectedDate) setBirthdate(selectedDate);
              }}
            />
          )}

          <FieldLabel label="Assign to Pen" />
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowPenModal(true)}
          >
            <View style={styles.dropdownInner}>
              {selectedPen && (
                <Ionicons name="home-outline" size={15} color={COLORS.gold} style={{ marginRight: 8 }} />
              )}
              <Text style={selectedPen ? styles.dropdownSelected : styles.dropdownPlaceholder}>
                {selectedPen ? selectedPen.name : 'Select or create a pen...'}
              </Text>
            </View>
            <Feather name="chevron-down" size={16} color={COLORS.textmuted} />
          </TouchableOpacity>

          <FieldLabel label="Breeder" />
          <TextInput
            style={styles.input}
            placeholder="e.g. Manny's Farm"
            placeholderTextColor={COLORS.textmuted}
            value={breeder}
            onChangeText={setBreeder}
          />

          {/* ── Section: Pedigree ── */}
          <View style={[styles.sectionHeader, { marginTop: 28 }]}>
            <MaterialCommunityIcons name="dna" size={14} color={COLORS.gold} />
            <Text style={styles.sectionTitle}>PEDIGREE</Text>
          </View>

          <FieldLabel label="Lineage Notes" />
          <TextInput
            style={[styles.input, styles.textarea]}
            placeholder="e.g. Sire: Champion Red · Dam: Pure Hatch line..."
            placeholderTextColor={COLORS.textmuted}
            value={pedigreeNotes}
            onChangeText={setPedigreeNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* ── Save Button ── */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.black} />
            ) : (
              <View style={styles.saveBtnInner}>
                <Image
                  source={require('../../assets/sabong_favicon.png')}
                  style={{
                    width: 18,
                    height: 18,
                    tintColor: COLORS.black,
                  }}
                  resizeMode="contain"
                />
                <Text style={styles.saveBtnText}>SAVE ROOSTER</Text>
              </View>
            )}
          </TouchableOpacity>

        </View>
      </ScrollView>

      {/* ── Pen Modal ── */}
      <Modal visible={showPenModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>

            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {showNewPenForm ? 'Create New Pen' : 'Select Pen'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => {
                  setShowPenModal(false);
                  setShowNewPenForm(false);
                  setNewPenName('');
                  setNewPenLocation('');
                }}
              >
                <Feather name="x" size={17} color={COLORS.textmuted} />
              </TouchableOpacity>
            </View>

            {!showNewPenForm ? (
              <>
                <FlatList
                  data={pens}
                  keyExtractor={(item) => item.id}
                  style={{ maxHeight: 280 }}
                  ListEmptyComponent={
                    <View style={styles.modalEmpty}>
                      <Ionicons name="home-outline" size={28} color={COLORS.border} />
                      <Text style={styles.emptyText}>No pens yet. Create one below.</Text>
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={[styles.penItem, selectedPen?.id === item.id && styles.penItemActive]}
                      onPress={() => { setSelectedPen(item); setShowPenModal(false); }}
                    >
                      <View style={styles.penItemLeft}>
                        <View style={styles.penIconWrap}>
                          <Ionicons name="home-outline" size={15} color={selectedPen?.id === item.id ? COLORS.gold : COLORS.textmuted} />
                        </View>
                        <View>
                          <Text style={[styles.penItemText, selectedPen?.id === item.id && { color: COLORS.gold }]}>
                            {item.name}
                          </Text>
                          {item.location && (
                            <Text style={styles.penItemSub}>{item.location}</Text>
                          )}
                        </View>
                      </View>
                      {selectedPen?.id === item.id && (
                        <Feather name="check" size={16} color={COLORS.gold} />
                      )}
                    </TouchableOpacity>
                  )}
                />

                <TouchableOpacity
                  style={styles.newPenBtn}
                  onPress={() => setShowNewPenForm(true)}
                >
                  <Feather name="plus" size={15} color={COLORS.gold} />
                  <Text style={styles.newPenBtnText}>Create New Pen</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.newPenForm}>
                <FieldLabel label="Pen Name" required />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Pen A, North Pen"
                  placeholderTextColor={COLORS.textmuted}
                  value={newPenName}
                  onChangeText={setNewPenName}
                />
                <FieldLabel label="Location (optional)" />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Backyard, Farm North"
                  placeholderTextColor={COLORS.textmuted}
                  value={newPenLocation}
                  onChangeText={setNewPenLocation}
                />
                <View style={styles.newPenActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setShowNewPenForm(false)}
                  >
                    <Feather name="arrow-left" size={14} color={COLORS.textlight} />
                    <Text style={styles.cancelBtnText}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.createBtn} onPress={handleCreatePen}>
                    <Text style={styles.createBtnText}>Create Pen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ── Small reusable label ── */
const FieldLabel = ({ label, required }) => (
  <Text style={fieldStyles.label}>
    {label}
    {required && <Text style={fieldStyles.required}> *</Text>}
  </Text>
);
const fieldStyles = StyleSheet.create({
  label: {
    fontSize: 11,
    color: COLORS.textmuted,
    fontWeight: '700',
    marginBottom: 7,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginTop: 16,
  },
  required: { color: COLORS.gold },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.black },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 20,
    backgroundColor: COLORS.darkgray,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 14,
  },
  backBtn: {
    backgroundColor: COLORS.gray,
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: COLORS.white, letterSpacing: -0.4 },
  headerSub: { fontSize: 12, color: COLORS.textmuted, marginTop: 3 },

  // Photo
  photoSection: { alignItems: 'center', paddingVertical: 28 },
  photoBtn: {
    width: 150,
    height: 150,
    borderRadius: 75,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.gold,
  },
  photoPreview: { width: '100%', height: '100%' },
  photoEmpty: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.darkgray,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  photoIconWrap: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: 24,
    padding: 14,
    marginBottom: 4,
  },
  photoEmptyTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textlight },
  photoEmptyText: { fontSize: 11, color: COLORS.textmuted },
  removePhoto: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
  },
  removePhotoText: { color: '#EF4444', fontSize: 13, fontWeight: '600' },

  // Form
  form: { paddingHorizontal: 16 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 24,
    marginBottom: 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.gold,
    letterSpacing: 2.5,
  },

  // Inputs
  input: {
    backgroundColor: COLORS.darkgray,
    borderRadius: 12,
    padding: 14,
    color: COLORS.white,
    fontSize: 15,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textarea: { minHeight: 110, paddingTop: 14 },

  // Dropdown
  dropdown: {
    backgroundColor: COLORS.darkgray,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownInner: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dropdownSelected: { color: COLORS.white, fontSize: 15 },
  dropdownPlaceholder: { color: COLORS.textmuted, fontSize: 15 },
  dropdownList: {
    backgroundColor: COLORS.gray,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  dropdownItemActive: { backgroundColor: 'rgba(212,175,55,0.08)' },
  dropdownItemText: { color: COLORS.white, fontSize: 14 },

  // Age preview
  agePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 7,
    marginLeft: 2,
  },
  agePreview: { fontSize: 12, color: COLORS.gold, fontWeight: '600' },

  // Save button
  saveBtn: {
    backgroundColor: COLORS.gold,
    borderRadius: 14,
    padding: 18,
    alignItems: 'center',
    marginTop: 36,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  saveBtnText: { color: COLORS.black, fontWeight: '900', fontSize: 15, letterSpacing: 1.5 },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.darkgray,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalHandle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '800', color: COLORS.white, letterSpacing: -0.3 },
  modalCloseBtn: {
    backgroundColor: COLORS.gray,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalEmpty: {
    alignItems: 'center',
    padding: 32,
    gap: 10,
  },
  penItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  penItemActive: { backgroundColor: 'rgba(212,175,55,0.08)' },
  penItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  penIconWrap: {
    backgroundColor: COLORS.gray,
    borderRadius: 8,
    padding: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  penItemText: { fontSize: 15, color: COLORS.textlight, fontWeight: '600' },
  penItemSub: { fontSize: 11, color: COLORS.textmuted, marginTop: 2 },
  emptyText: { color: COLORS.textmuted, textAlign: 'center', fontSize: 13 },
  newPenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    margin: 16,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.gold,
    borderStyle: 'dashed',
  },
  newPenBtnText: { color: COLORS.gold, fontWeight: '700', fontSize: 14 },
  newPenForm: { padding: 20 },
  newPenActions: { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textlight, fontWeight: '700' },
  createBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.gold,
    alignItems: 'center',
  },
  createBtnText: { color: COLORS.black, fontWeight: '900' },
});