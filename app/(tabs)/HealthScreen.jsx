import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, RefreshControl, Alert, Platform,
  KeyboardAvoidingView, Keyboard,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useRoosters } from '../../hooks/useRoosters';
import { useNotifications } from '../../hooks/useNotifications'; // ✅ added
import { COLORS, SYMPTOMS } from '../../constants/theme';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  bg:         '#0A0A0B',
  surface:    '#111113',
  surface2:   '#18181B',
  surface3:   '#202024',
  border:     'rgba(255,255,255,0.06)',
  border2:    'rgba(255,255,255,0.10)',
  border3:    'rgba(255,255,255,0.16)',
  gold:       '#C9A84C',
  goldLight:  '#E2C97E',
  goldDim:    'rgba(201,168,76,0.09)',
  goldBorder: 'rgba(201,168,76,0.22)',
  white:      '#F0EDE8',
  sub:        '#8A8994',
  muted:      '#4E4D56',
  redDim:     'rgba(200,55,55,0.10)',
  redBorder:  'rgba(200,55,55,0.25)',
  redText:    '#D97070',
  tealDim:    'rgba(28,150,110,0.10)',
  tealBorder: 'rgba(28,150,110,0.25)',
  tealText:   '#45BF96',
};

// ─── Rooster chip row ─────────────────────────────────────────────────────────
function RoosterSelector({ roosters, selectedId, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: 20 }}
      contentContainerStyle={{ gap: 8, paddingRight: 4 }}
    >
      {roosters.map(r => {
        const active = selectedId === r.id;
        return (
          <TouchableOpacity
            key={r.id}
            style={[s.chip, active && s.chipActive]}
            onPress={() => onSelect(r.id)}
            activeOpacity={0.75}
          >
            <Text style={[s.chipText, active && s.chipTextActive]}>🐓 {r.name}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── Field primitives ─────────────────────────────────────────────────────────
function FieldLabel({ children }) {
  return <Text style={s.fieldLabel}>{children}</Text>;
}

function Field({ label, multiline, inputRef, ...props }) {
  return (
    <>
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        ref={inputRef}
        style={[s.input, multiline && s.inputMulti]}
        placeholderTextColor={T.muted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        scrollEnabled={false}
        {...props}
      />
    </>
  );
}

function DateField({ label, ...props }) {
  return (
    <Field
      label={label}
      placeholder="YYYY-MM-DD"
      keyboardType={Platform.OS === 'ios' ? 'numbers-and-punctuation' : 'numeric'}
      maxLength={10}
      {...props}
    />
  );
}

// ─── Form shell ───────────────────────────────────────────────────────────────
function FormShell({ title, onCancel, onSave, saveLabel = 'Save', children }) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={s.form}>
          <Text style={s.formTitle}>{title}</Text>
          {children}
          <View style={s.formActions}>
            <TouchableOpacity style={s.btnCancel} onPress={onCancel} activeOpacity={0.7}>
              <Text style={s.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSave} onPress={onSave} activeOpacity={0.85}>
              <Text style={s.btnSaveText}>{saveLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Add button ───────────────────────────────────────────────────────────────
function AddButton({ label, onPress }) {
  return (
    <TouchableOpacity style={s.addBtn} onPress={onPress} activeOpacity={0.75}>
      <Text style={s.addBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ label, count }) {
  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionLabel}>{label}</Text>
      {count !== undefined && (
        <View style={s.sectionCount}>
          <Text style={s.sectionCountText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Log card ─────────────────────────────────────────────────────────────────
function LogCard({ icon, name, dateLabel, relDate, sub, dueLabel, dueDate, children }) {
  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.cardLeft}>
          <View style={s.cardIconWrap}>
            <Text style={{ fontSize: 14 }}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.cardName} numberOfLines={1}>{name}</Text>
            {sub ? <Text style={s.cardSub}>{sub}</Text> : null}
          </View>
        </View>
        <View style={s.cardMeta}>
          {relDate ? <Text style={s.cardRelDate}>{relDate}</Text> : null}
          {dateLabel ? <Text style={s.cardDateSub}>{dateLabel}</Text> : null}
        </View>
      </View>
      {children ? (
        <>
          <View style={s.cardDivider} />
          <View style={{ paddingTop: 2 }}>{children}</View>
        </>
      ) : null}
      {dueLabel && dueDate ? (
        <View style={s.duePill}>
          <View style={s.dueDot} />
          <Text style={s.duePillText}>{dueLabel}: {dueDate}</Text>
        </View>
      ) : null}
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ text }) {
  return (
    <View style={s.empty}>
      <View style={s.emptyIconWrap}>
        <Text style={s.emptyDash}>—</Text>
      </View>
      <Text style={s.emptyTitle}>No records yet</Text>
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

// ─── Symptom form ─────────────────────────────────────────────────────────────
function SymptomForm({ roosters, preselectedRoosterId, onSaved, onCancel }) {
  const [roosterId, setRoosterId] = useState(preselectedRoosterId ?? null);
  const [selected, setSelected] = useState([]);
  const [notes, setNotes] = useState('');
  const notesRef = useRef(null);

  const toggle = sym =>
    setSelected(p => p.includes(sym) ? p.filter(x => x !== sym) : [...p, sym]);

  const save = async () => {
    if (!roosterId) { Alert.alert('Required', 'Please select a rooster.'); return; }
    if (!selected.length) { Alert.alert('Required', 'Select at least one symptom.'); return; }
    const { error } = await supabase.from('health_logs').insert({
      rooster_id: roosterId,
      logged_at: new Date().toISOString().split('T')[0],
      symptoms: selected,
      notes: notes.trim() || null,
    });
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Saved', 'Health log recorded.');
    onSaved(); onCancel();
  };

  return (
    <FormShell title="Log Symptoms" onCancel={onCancel} onSave={save} saveLabel="Save Log">
      <FieldLabel>Rooster *</FieldLabel>
      <RoosterSelector roosters={roosters} selectedId={roosterId} onSelect={setRoosterId} />
      <FieldLabel>Symptoms *</FieldLabel>
      <View style={s.symptomGrid}>
        {SYMPTOMS.map(sym => {
          const active = selected.includes(sym);
          return (
            <TouchableOpacity
              key={sym}
              style={[s.symptomChip, active && s.symptomChipActive]}
              onPress={() => toggle(sym)}
              activeOpacity={0.75}
            >
              <Text style={[s.symptomChipText, active && s.symptomChipTextActive]}>
                {sym}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Field
        label="Notes"
        placeholder="Additional observations..."
        value={notes}
        onChangeText={setNotes}
        multiline
        inputRef={notesRef}
        onFocus={() => {
          setTimeout(() => notesRef.current?.measureInWindow((x, y) => {}), 200);
        }}
      />
    </FormShell>
  );
}

// ─── Vaccination form ─────────────────────────────────────────────────────────
// ✅ accepts scheduleReminder as prop
function AddVaccinationForm({ roosters, onSaved, scheduleReminder }) {
  const [show, setShow] = useState(false);
  const [roosterId, setRoosterId] = useState(null);
  const [name, setName] = useState('');
  const [dateGiven, setDateGiven] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [adminBy, setAdminBy] = useState('');

  const reset = () => {
    setShow(false); setRoosterId(null); setName('');
    setDateGiven(''); setNextDue(''); setAdminBy('');
  };

  const save = async () => {
    if (!roosterId || !name || !dateGiven) {
      Alert.alert('Required', 'Rooster, vaccine name, and date are required.');
      return;
    }
    const { error } = await supabase.from('vaccination_records').insert({
      rooster_id: roosterId, vaccine_name: name, date_given: dateGiven,
      next_due_date: nextDue || null, administered_by: adminBy || null,
    });
    if (error) { Alert.alert('Error', error.message); return; }

    // ✅ Schedule reminder if next due date exists
    if (nextDue && scheduleReminder) {
      const rooster = roosters.find(r => r.id === roosterId);
      if (rooster) await scheduleReminder(rooster.name, name, nextDue);
    }

    Alert.alert('Saved', 'Vaccination recorded.');
    reset(); onSaved();
  };

  if (!show) return <AddButton label="+ Add Vaccination Record" onPress={() => setShow(true)} />;
  return (
    <FormShell title="Add Vaccination" onCancel={reset} onSave={save}>
      <FieldLabel>Rooster *</FieldLabel>
      <RoosterSelector roosters={roosters} selectedId={roosterId} onSelect={setRoosterId} />
      <Field label="Vaccine Name *" placeholder="e.g. Newcastle Disease"
        value={name} onChangeText={setName} />
      <DateField label="Date Given *" value={dateGiven} onChangeText={setDateGiven} />
      <DateField label="Next Due Date" value={nextDue} onChangeText={setNextDue} />
      <Field label="Administered By" placeholder="e.g. Dr. Santos"
        value={adminBy} onChangeText={setAdminBy} />
    </FormShell>
  );
}

// ─── Vet visit form ───────────────────────────────────────────────────────────
// ✅ accepts scheduleReminder as prop
function AddVetVisitForm({ roosters, onSaved, scheduleReminder }) {
  const [show, setShow] = useState(false);
  const [roosterId, setRoosterId] = useState(null);
  const [visitDate, setVisitDate] = useState('');
  const [vetName, setVetName] = useState('');
  const [reason, setReason] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatment, setTreatment] = useState('');
  const [nextVisit, setNextVisit] = useState('');

  const reset = () => {
    setShow(false); setRoosterId(null); setVisitDate(''); setVetName('');
    setReason(''); setDiagnosis(''); setTreatment(''); setNextVisit('');
  };

  const save = async () => {
    if (!roosterId || !visitDate) {
      Alert.alert('Required', 'Rooster and visit date are required.');
      return;
    }
    const { error } = await supabase.from('vet_visits').insert({
      rooster_id: roosterId, visit_date: visitDate, vet_name: vetName || null,
      reason: reason || null, diagnosis: diagnosis || null,
      treatment: treatment || null, next_visit_date: nextVisit || null,
    });
    if (error) { Alert.alert('Error', error.message); return; }

    // ✅ Schedule reminder if next visit date exists
    if (nextVisit && scheduleReminder) {
      const rooster = roosters.find(r => r.id === roosterId);
      if (rooster) await scheduleReminder(rooster.name, nextVisit);
    }

    Alert.alert('Saved', 'Vet visit recorded.');
    reset(); onSaved();
  };

  if (!show) return <AddButton label="+ Add Vet Visit" onPress={() => setShow(true)} />;
  return (
    <FormShell title="Add Vet Visit" onCancel={reset} onSave={save}>
      <FieldLabel>Rooster *</FieldLabel>
      <RoosterSelector roosters={roosters} selectedId={roosterId} onSelect={setRoosterId} />
      <DateField label="Visit Date *" value={visitDate} onChangeText={setVisitDate} />
      <Field label="Veterinarian" placeholder="e.g. Dr. Reyes"
        value={vetName} onChangeText={setVetName} />
      <Field label="Reason for Visit" placeholder="e.g. Routine checkup"
        value={reason} onChangeText={setReason} />
      <Field label="Diagnosis" placeholder="e.g. Respiratory infection"
        value={diagnosis} onChangeText={setDiagnosis} />
      <Field label="Treatment" placeholder="e.g. Antibiotics 5 days"
        value={treatment} onChangeText={setTreatment} multiline />
      <DateField label="Next Visit" value={nextVisit} onChangeText={setNextVisit} />
    </FormShell>
  );
}

// ─── Feeding form ─────────────────────────────────────────────────────────────
function AddFeedingForm({ roosters, onSaved }) {
  const [show, setShow] = useState(false);
  const [roosterId, setRoosterId] = useState(null);
  const [feedType, setFeedType] = useState('');
  const [amount, setAmount] = useState('');
  const [supplements, setSupplements] = useState('');
  const [notes, setNotes] = useState('');

  const reset = () => {
    setShow(false); setRoosterId(null); setFeedType('');
    setAmount(''); setSupplements(''); setNotes('');
  };
  const save = async () => {
    if (!roosterId) { Alert.alert('Required', 'Please select a rooster.'); return; }
    const { error } = await supabase.from('feeding_logs').insert({
      rooster_id: roosterId,
      logged_at: new Date().toISOString().split('T')[0],
      feed_type: feedType || null,
      amount_grams: amount ? parseFloat(amount) : null,
      supplements: supplements ? supplements.split(',').map(x => x.trim()).filter(Boolean) : [],
      notes: notes.trim() || null,
    });
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Saved', 'Feeding log recorded.');
    reset(); onSaved();
  };

  if (!show) return <AddButton label="+ Add Feeding Log" onPress={() => setShow(true)} />;
  return (
    <FormShell title="Add Feeding Log" onCancel={reset} onSave={save}>
      <FieldLabel>Rooster *</FieldLabel>
      <RoosterSelector roosters={roosters} selectedId={roosterId} onSelect={setRoosterId} />
      <Field label="Feed Type" placeholder="e.g. Pellets, Corn, Mixed Grain"
        value={feedType} onChangeText={setFeedType} />
      <Field label="Amount (grams)" placeholder="e.g. 250"
        value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <Field label="Supplements (comma-separated)"
        placeholder="e.g. Vitamin C, Electrolytes"
        value={supplements} onChangeText={setSupplements} />
      <Field label="Notes" placeholder="Additional notes..."
        value={notes} onChangeText={setNotes} multiline />
    </FormShell>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = iso => {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
};

const relDate = iso => {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff}d ago`;
  return fmtDate(iso);
};

// ─── Main screen ──────────────────────────────────────────────────────────────
const TABS = [
  { key: 'symptoms',     label: 'Symptoms'  },
  { key: 'vaccinations', label: 'Vaccines'   },
  { key: 'vet',          label: 'Vet Visits' },
  { key: 'feeding',      label: 'Feeding'    },
];

export default function HealthScreen({ route }) {
  const { user } = useAuth();
  const { roosters, fetchRoosters } = useRoosters();
  // ✅ pull both schedulers from the hook at the top level
  const { scheduleVaccinationReminder, scheduleVetReminder } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('symptoms');
  const [recentLogs, setRecentLogs] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [vetVisits, setVetVisits] = useState([]);
  const [feedingLogs, setFeedingLogs] = useState([]);
  const [showSymptomForm, setShowSymptomForm] = useState(false);
  const [preselectedRoosterId, setPreselectedRoosterId] = useState(null);

  const fetchHealthData = useCallback(async () => {
    if (!user || !roosters.length) return;
    setLoading(true);
    const ids = roosters.map(r => r.id);
    try {
      const [{ data: hd }, { data: vd }, { data: vtd }, { data: fd }] = await Promise.all([
        supabase.from('health_logs').select('*, roosters(name)')
          .in('rooster_id', ids).order('logged_at', { ascending: false }).limit(20),
        supabase.from('vaccination_records').select('*, roosters(name)')
          .in('rooster_id', ids).order('next_due_date', { ascending: true }).limit(20),
        supabase.from('vet_visits').select('*, roosters(name)')
          .in('rooster_id', ids).order('visit_date', { ascending: false }).limit(20),
        supabase.from('feeding_logs').select('*, roosters(name)')
          .in('rooster_id', ids).order('logged_at', { ascending: false }).limit(20),
      ]);
      setRecentLogs(hd || []);
      setVaccinations(vd || []);
      setVetVisits(vtd || []);
      setFeedingLogs(fd || []);
    } catch (err) {
      console.error('fetchHealthData:', err);
    }
    setLoading(false);
  }, [user, roosters]);

  useFocusEffect(useCallback(() => { fetchRoosters(); }, [user]));
  useFocusEffect(useCallback(() => { fetchHealthData(); }, [fetchHealthData]));

  useFocusEffect(useCallback(() => {
    const incoming = route?.params?.preselectedRoosterId;
    if (incoming) {
      setPreselectedRoosterId(incoming);
      setActiveTab('symptoms');
      setShowSymptomForm(true);
    }
  }, [route?.params?.preselectedRoosterId]));

  const currentCount = {
    symptoms: recentLogs.length,
    vaccinations: vaccinations.length,
    vet: vetVisits.length,
    feeding: feedingLogs.length,
  }[activeTab];

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.eyebrow}>Health Center</Text>
        <Text style={s.headerTitle}>Health Records</Text>
        <Text style={s.headerSub}>Monitor and log rooster health</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={s.tabBar}
        contentContainerStyle={s.tabBarContent}
      >
        {TABS.map(t => (
          <TouchableOpacity
            key={t.key}
            activeOpacity={0.75}
            style={[s.tab, activeTab === t.key && s.tabActive]}
            onPress={() => { setActiveTab(t.key); setShowSymptomForm(false); }}
          >
            <Text style={[s.tabText, activeTab === t.key && s.tabTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={s.scroll}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchHealthData} tintColor={T.gold} />
        }
      >
        <View style={s.content}>

          {activeTab === 'symptoms' && (
            showSymptomForm
              ? <SymptomForm
                  roosters={roosters}
                  preselectedRoosterId={preselectedRoosterId}
                  onSaved={fetchHealthData}
                  onCancel={() => {
                    setShowSymptomForm(false);
                    setPreselectedRoosterId(null);
                  }}
                />
              : <>
                  <AddButton label="+ Log Symptoms" onPress={() => setShowSymptomForm(true)} />
                  {recentLogs.length === 0
                    ? <EmptyState text="No health logs yet. Tap above to record symptoms." />
                    : <>
                        <SectionHeader label="Recent Logs" count={recentLogs.length} />
                        {recentLogs.map(log => (
                          <LogCard
                            key={log.id}
                            icon="🐓"
                            name={log.roosters?.name}
                            dateLabel={fmtDate(log.logged_at)}
                            relDate={relDate(log.logged_at)}
                          >
                            <View style={s.tagRow}>
                              {log.symptoms?.map(sym => (
                                <View key={sym} style={s.tagRed}>
                                  <Text style={s.tagRedText}>{sym}</Text>
                                </View>
                              ))}
                            </View>
                            {log.notes ? <Text style={s.noteText}>{log.notes}</Text> : null}
                          </LogCard>
                        ))}
                      </>
                  }
                </>
          )}

          {activeTab === 'vaccinations' && (
            <>
              {/* ✅ scheduleVaccinationReminder passed as prop */}
              <AddVaccinationForm
                roosters={roosters}
                onSaved={fetchHealthData}
                scheduleReminder={scheduleVaccinationReminder}
              />
              {vaccinations.length === 0
                ? <EmptyState text="No vaccination records yet." />
                : <>
                    <SectionHeader label="Vaccination Records" count={vaccinations.length} />
                    {vaccinations.map(v => (
                      <LogCard
                        key={v.id}
                        icon="🐓"
                        name={v.vaccine_name}
                        dateLabel={fmtDate(v.date_given)}
                        sub={v.roosters?.name}
                        dueLabel={v.next_due_date ? 'Next due' : null}
                        dueDate={v.next_due_date ? fmtDate(v.next_due_date) : null}
                      >
                        {v.administered_by
                          ? <Text style={s.noteText}>Administered by: {v.administered_by}</Text>
                          : null}
                      </LogCard>
                    ))}
                  </>
              }
            </>
          )}

          {activeTab === 'vet' && (
            <>
              {/* ✅ scheduleVetReminder passed as prop */}
              <AddVetVisitForm
                roosters={roosters}
                onSaved={fetchHealthData}
                scheduleReminder={scheduleVetReminder}
              />
              {vetVisits.length === 0
                ? <EmptyState text="No vet visits recorded yet." />
                : <>
                    <SectionHeader label="Vet Visits" count={vetVisits.length} />
                    {vetVisits.map(v => (
                      <LogCard
                        key={v.id}
                        icon="🐓"
                        name={v.reason || 'Vet Visit'}
                        dateLabel={fmtDate(v.visit_date)}
                        sub={v.roosters?.name}
                        dueLabel={v.next_visit_date ? 'Next visit' : null}
                        dueDate={v.next_visit_date ? fmtDate(v.next_visit_date) : null}
                      >
                        {v.vet_name ? (
                          <Text style={s.noteText}>Veterinarian: {v.vet_name}</Text>
                        ) : null}
                        {v.diagnosis ? (
                          <Text style={s.noteText}>Diagnosis: {v.diagnosis}</Text>
                        ) : null}
                        {v.treatment ? (
                          <Text style={s.noteText}>Treatment: {v.treatment}</Text>
                        ) : null}
                      </LogCard>
                    ))}
                  </>
              }
            </>
          )}

          {activeTab === 'feeding' && (
            <>
              <AddFeedingForm roosters={roosters} onSaved={fetchHealthData} />
              {feedingLogs.length === 0
                ? <EmptyState text="No feeding logs yet." />
                : <>
                    <SectionHeader label="Feeding Logs" count={feedingLogs.length} />
                    {feedingLogs.map(f => (
                      <LogCard
                        key={f.id}
                        icon="🐓"
                        name={f.feed_type || 'Feeding Log'}
                        dateLabel={fmtDate(f.logged_at)}
                        sub={f.roosters?.name}
                      >
                        {f.amount_grams != null
                          ? <Text style={s.noteText}>Amount: {f.amount_grams}g</Text>
                          : null}
                        {f.supplements?.length > 0 && (
                          <View style={[s.tagRow, { marginTop: 8 }]}>
                            {f.supplements.map(sup => (
                              <View key={sup} style={s.tagTeal}>
                                <Text style={s.tagTealText}>{sup}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                        {f.notes ? <Text style={s.noteText}>{f.notes}</Text> : null}
                      </LogCard>
                    ))}
                  </>
              }
            </>
          )}

        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 58 : 40,
    paddingBottom: 20,
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: T.gold,
    marginBottom: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: T.white,
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  headerSub: { fontSize: 13, color: T.muted, marginTop: 4 },

  tabBar: {
    backgroundColor: T.surface,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    flexShrink: 0,
    maxHeight: 50,
  },
  tabBarContent: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    gap: 6,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: T.border2,
  },
  tabActive: { backgroundColor: T.gold, borderColor: T.gold },
  tabText: { color: T.sub, fontWeight: '600', fontSize: 12, letterSpacing: 0.2 },
  tabTextActive: { color: '#0A0A0B', fontWeight: '800' },

  scroll: { flex: 1 },
  content: { padding: 14 },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: T.sub,
  },
  sectionCount: {
    backgroundColor: T.surface3,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  sectionCountText: { fontSize: 10, fontWeight: '700', color: T.muted },

  addBtn: {
    borderWidth: 1,
    borderColor: T.goldBorder,
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 14,
    backgroundColor: T.goldDim,
  },
  addBtnText: { color: T.gold, fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },

  card: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: T.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, flex: 1 },
  cardIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: T.goldDim,
    borderWidth: 1,
    borderColor: T.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    color: T.white,
    letterSpacing: -0.1,
  },
  cardSub: {
    fontSize: 11,
    color: T.gold,
    marginTop: 2,
    fontWeight: '500',
  },
  cardMeta: { alignItems: 'flex-end', gap: 2, flexShrink: 0, marginLeft: 8 },
  cardRelDate: {
    fontSize: 11,
    color: T.sub,
    fontWeight: '600',
  },
  cardDateSub: { fontSize: 10, color: T.muted },
  cardDivider: { height: 1, backgroundColor: T.border, marginVertical: 10 },

  duePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: T.goldDim,
    borderWidth: 1,
    borderColor: T.goldBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  dueDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: T.gold },
  duePillText: { fontSize: 11, color: T.gold, fontWeight: '600' },

  noteText: {
    fontSize: 12,
    color: T.sub,
    lineHeight: 18,
    marginTop: 4,
  },

  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tagRed: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: T.redDim,
    borderWidth: 1,
    borderColor: T.redBorder,
  },
  tagRedText: { fontSize: 11, fontWeight: '600', color: T.redText },
  tagTeal: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    backgroundColor: T.tealDim,
    borderWidth: 1,
    borderColor: T.tealBorder,
  },
  tagTealText: { fontSize: 11, fontWeight: '600', color: T.tealText },

  chip: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.border2,
  },
  chipActive: { backgroundColor: T.gold, borderColor: T.gold },
  chipText: { color: T.sub, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: '#0A0A0B', fontWeight: '800' },

  symptomGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  symptomChip: {
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: T.surface2,
    borderWidth: 1,
    borderColor: T.border2,
  },
  symptomChipActive: { backgroundColor: T.redDim, borderColor: T.redBorder },
  symptomChipText: { color: T.sub, fontSize: 12 },
  symptomChipTextActive: { color: T.redText, fontWeight: '700' },

  form: {
    backgroundColor: T.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: T.border2,
  },
  formTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: T.white,
    letterSpacing: -0.3,
    marginBottom: 22,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: T.sub,
    marginBottom: 7,
  },
  input: {
    backgroundColor: T.surface2,
    borderRadius: 8,
    paddingHorizontal: 13,
    paddingVertical: 11,
    color: T.white,
    fontSize: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border2,
  },
  inputMulti: {
    minHeight: 90,
    paddingTop: 11,
    paddingBottom: 16,
  },

  formActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btnCancel: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: T.border2,
    alignItems: 'center',
  },
  btnCancelText: { color: T.sub, fontWeight: '700', fontSize: 14 },
  btnSave: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: T.gold,
    alignItems: 'center',
  },
  btnSaveText: { color: '#0A0A0B', fontWeight: '900', fontSize: 14 },

  empty: {
    alignItems: 'center',
    paddingTop: 32,
    paddingBottom: 16,
    gap: 6,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyDash: { fontSize: 20, color: T.muted, fontWeight: '300' },
  emptyTitle: { fontSize: 14, fontWeight: '700', color: T.white },
  emptyText: {
    fontSize: 12,
    color: T.muted,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 220,
  },
});