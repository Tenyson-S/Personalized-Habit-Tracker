import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { scheduleRecurringTaskReminder, scheduleStartReminder, scheduleWeeklyActivityReminders } from '../../services/reminders';
import { useComposerStore } from '../../store/composerStore';
import { colors, radius, spacing } from '../../theme/tokens';
import { AppText, AppButton, AppInput } from '../../components/ui';
import { DatePickerField } from '../../components/forms/DatePickerField';
import { TimePickerField } from '../../components/forms/TimePickerField';
import { extractLocalDateForApi, extractLocalTimeForApi } from '../../utils/date';
import { addHours } from 'date-fns';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const DAY_LABELS = ['M','T','W','T','F','S','S'];
type Kind='habit'|'daily'|'task';

function localIso(date:string,time:string){
  if(!date || !time) return null;
  const parsed=new Date(`${date}T${time}:00`); return Number.isNaN(parsed.getTime())?null:parsed;
}
export function ActivityComposer(){
 const queryClient = useQueryClient();
 const { isOpen, initialData, close } = useComposerStore();
 const visible = isOpen;
 const onClose = close;
 const onSaved = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['manage-habits'] }),
      queryClient.invalidateQueries({ queryKey: ['manage-dailies'] }),
      queryClient.invalidateQueries({ queryKey: ['manage-tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['today'] }),
    ]);
 };
 const [kind,setKind]=useState<Kind>('habit'); const [title,setTitle]=useState(''); const [description,setDescription]=useState('');
 const [originType,setOriginType]=useState<'NEW'|'EXISTING'>('NEW');
 const [days,setDays]=useState<Record<string,boolean>>(Object.fromEntries(DAYS.map(d=>[d,true]))); 
 const [time,setTime]=useState(extractLocalTimeForApi(new Date()).slice(0,5));
 const [startDate,setStartDate]=useState(extractLocalDateForApi(new Date())); 
 const [dueDate,setDueDate]=useState(extractLocalDateForApi(new Date()));
 const [dueTime,setDueTime]=useState(''); 
 const [recurring,setRecurring]=useState(false); const [frequency,setFrequency]=useState<'DAILY'|'WEEKLY'|'MONTHLY'>('WEEKLY'); const [saving,setSaving]=useState(false);
 const [scheduleMode,setScheduleMode]=useState<'SELECTED_DAYS'|'WEEKLY_TARGET'>('SELECTED_DAYS'); const [targetPerWeek,setTargetPerWeek]=useState('5');
 const schedule=useMemo(()=>Object.fromEntries(DAYS.map(d=>[d,Boolean(days[d])])),[days]);

 useEffect(() => {
    if (visible && initialData) {
      setKind(initialData.type);
      setTitle(initialData.data.name ?? initialData.data.title ?? '');
      setDescription(initialData.data.description ?? '');
      if (initialData.data.preferred_time) setTime(initialData.data.preferred_time.slice(0,5));
      if (initialData.type === 'task') {
        if (initialData.data.starts_at) {
          const d = new Date(initialData.data.starts_at);
          setStartDate(d.toISOString().slice(0,10));
          setTime(d.toTimeString().slice(0,5));
        }
        if (initialData.data.due_date) setDueDate(initialData.data.due_date);
        if (initialData.data.due_at) setDueTime(new Date(initialData.data.due_at).toTimeString().slice(0,5));
        setRecurring(initialData.data.is_recurring ?? false);
      } else {
        if (initialData.data.start_date) setStartDate(initialData.data.start_date);
      }
      if (initialData.data.schedule) {
        setDays(initialData.data.schedule);
      }
    } else if (visible && !initialData) {
      reset();
    }
  }, [visible, initialData]);

 function reset(){setKind('habit');setTitle('');setDescription('');setRecurring(false);setOriginType('NEW');setTime(extractLocalTimeForApi(new Date()).slice(0,5));setStartDate(extractLocalDateForApi(new Date()));setDueDate(extractLocalDateForApi(new Date()));setDueTime('');}
 async function save(){
  if(!title.trim()) return; setSaving(true);
  try{
   if(kind==='habit') {
    const payload = {name:title.trim(),description,habit_type:'BOOLEAN',start_date:startDate,origin_type:originType,existing_since:originType==='EXISTING'?startDate:null,foundation_target:21,is_active:true,schedule_mode:scheduleMode,target_per_week:scheduleMode==='WEEKLY_TARGET'?Number(targetPerWeek):null,preferred_time:`${time}:00`,reminder_enabled:true,reminder_minutes_before:10,status:'ACTIVE',schedule};
    if (initialData) await api.patch(`/habits/${initialData.id}/`, payload);
    else await api.post('/habits/', payload);
   }
   if(kind==='daily') {
    const payload = {title:title.trim(),description,start_date:startDate,preferred_time:`${time}:00`,reminder_enabled:true,reminder_minutes_before:10,status:'ACTIVE',schedule};
    if (initialData) await api.patch(`/dailies/${initialData.id}/`, payload);
    else await api.post('/dailies/', payload);
   }
   if(kind==='task'){
    const starts=localIso(startDate,time); const due=localIso(dueDate,dueTime);
    const payload = {title:title.trim(),description,priority:'NORMAL',starts_at:starts?.toISOString(),due_at:due?.toISOString(),due_date:dueDate,is_recurring:recurring,reminder_enabled:true,reminder_minutes_before:10,status:'OPEN',recurrence:recurring?{frequency,interval:1,days_of_week:frequency==='WEEKLY'?DAYS.filter(d=>days[d]).map(d=>d.toUpperCase()):[],day_of_month:frequency==='MONTHLY'?Number(dueDate.slice(-2)):null,ends_at:null}:null};
    if (initialData) await api.patch(`/tasks/${initialData.id}/`, payload);
    else await api.post('/tasks/', payload);
    
    if(recurring) await scheduleRecurringTaskReminder({ title:title.trim(), time, frequency, days:DAYS.filter(d=>days[d]), dayOfMonth:Number(dueDate.slice(-2)), minutesBefore:10 });
    else if(starts) await scheduleStartReminder({title:title.trim(),startsAt:starts,minutesBefore:10});
   } else {
    if(scheduleMode==='SELECTED_DAYS' || kind==='daily') await scheduleWeeklyActivityReminders({ title:title.trim(), time, days:DAYS.filter(d=>days[d]), minutesBefore:10 });
   }
   reset(); onSaved(); onClose();
  }catch(e:any){Alert.alert('Could not save',e?.response?.data?JSON.stringify(e.response.data):'Nothing was lost. Please try again.');} finally{setSaving(false);}
 }
  return <Modal visible={visible} transparent={true} animationType="fade" onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ScrollView contentContainerStyle={styles.page}>
          <View style={styles.row}><View><Text style={styles.eyebrow}>{initialData ? 'EDIT ACTIVITY' : 'ADD TO YOUR LIFE'}</Text><Text style={styles.title}>{initialData ? 'Update details' : 'What are you adding?'}</Text></View><Pressable onPress={onClose}><Text style={styles.close}>Close</Text></Pressable></View>
  {!initialData && <View style={styles.segments}>{(['habit','daily','task'] as Kind[]).map(k=><Pressable key={k} onPress={()=>setKind(k)} style={[styles.segment,kind===k&&styles.active]}><Text style={kind===k?styles.activeText:styles.muted}>{k[0].toUpperCase()+k.slice(1)}</Text></Pressable>)}</View>}
  {kind==='habit' && !initialData ?<>
    <Text style={styles.label}>Is this new to your life?</Text>
    <View style={styles.originRow}>
      <Pressable onPress={()=>setOriginType('NEW')} style={[styles.originCard,originType==='NEW'&&styles.originCardActive]}>
        <Text style={styles.originTitle}>New habit</Text>
        <Text style={styles.originBody}>Build a 21-day foundation. Misses never reset it.</Text>
      </Pressable>
      <Pressable onPress={()=>setOriginType('EXISTING')} style={[styles.originCard,originType==='EXISTING'&&styles.originCardActive]}>
        <Text style={styles.originTitle}>Existing habit</Text>
        <Text style={styles.originBody}>Already part of your life. Start observing from here.</Text>
      </Pressable>
    </View>
    <View style={[styles.foundationNote,originType==='EXISTING'&&styles.existingNote]}>
      <Text style={styles.foundationKicker}>{originType==='NEW'?'21-DAY FOUNDATION':'EXISTING RHYTHM'}</Text>
      <Text style={styles.foundationBody}>{originType==='NEW'?'A scheduled check-in moves the counter forward. Missing a day does not erase the foundation, and random off-schedule activity does not count.':'Hearth will not pretend your earlier effort never happened. This habit starts established.'}</Text>
    </View>
  </>:null}
  <AppInput label="Name" value={title} onChangeText={setTitle} placeholder={kind==='habit'?'Example: Read regularly':kind==='daily'?'Example: Review tomorrow’s plan':'Example: Finish portfolio API'} />
  <AppInput label="Description (optional)" value={description} onChangeText={setDescription} multiline style={{minHeight:70}} />
  {kind!=='task'?<><AppText variant="bodySm" weight="semiBold" style={styles.label}>Schedule</AppText><View style={styles.segments}><Pressable onPress={()=>setScheduleMode('SELECTED_DAYS')} style={[styles.segment,scheduleMode==='SELECTED_DAYS'&&styles.active]}><Text style={scheduleMode==='SELECTED_DAYS'?styles.activeText:styles.muted}>Selected days</Text></Pressable>{kind==='habit'?<Pressable onPress={()=>setScheduleMode('WEEKLY_TARGET')} style={[styles.segment,scheduleMode==='WEEKLY_TARGET'&&styles.active]}><Text style={scheduleMode==='WEEKLY_TARGET'?styles.activeText:styles.muted}>Days per week</Text></Pressable>:null}</View>{scheduleMode==='WEEKLY_TARGET'&&kind==='habit'?<AppInput value={targetPerWeek} onChangeText={setTargetPerWeek} keyboardType="number-pad" />:<View style={styles.days}>{DAYS.map((d,i)=><Pressable key={d} onPress={()=>setDays({...days,[d]:!days[d]})} style={[styles.day,days[d]&&styles.dayActive]}><Text>{DAY_LABELS[i]}</Text></Pressable>)}</View>}</>:null}
  
  <View style={styles.inline}>
    <View style={{flex:1}}><DatePickerField label={kind==='task'?'Start Date':'Start Date'} value={startDate} onChange={setStartDate} /></View>
    <View style={{flex:1}}><TimePickerField label="Time" value={time} onChange={(v) => setTime(v.slice(0,5))} /></View>
  </View>
  
  {kind==='task'?<>
    <View style={styles.inline}>
      <View style={{flex:1}}><DatePickerField label="Due Date" value={dueDate} onChange={setDueDate} /></View>
      <View style={{flex:1}}><TimePickerField label="Due Time" value={dueTime} onChange={(v) => setDueTime(v ? v.slice(0,5) : '')} allowClear /></View>
    </View>
    <Pressable onPress={()=>setRecurring(!recurring)} style={styles.toggle}><AppText variant="bodySm" weight="semiBold">Recurring task</AppText><Text style={styles.toggleText}>{recurring?'Yes':'No'}</Text></Pressable>{recurring?<View style={styles.segments}>{(['DAILY','WEEKLY','MONTHLY'] as const).map(f=><Pressable key={f} onPress={()=>setFrequency(f)} style={[styles.segment,frequency===f&&styles.active]}><Text style={frequency===f?styles.activeText:styles.muted}>{f.toLowerCase()}</Text></Pressable>)}</View>:null}
  </>:null}
  <View style={styles.reminder}><AppText variant="bodySm" weight="semiBold">Reminder</AppText><Text style={styles.reminderText}>10 minutes before start time</Text></View>
  <AppButton isLoading={saving} disabled={!title.trim()} onPress={save} label={initialData?`Save changes`:`Create ${kind}`} style={{marginTop: 12}} />
 </ScrollView></View></View></Modal>
}
const styles=StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: colors.background, borderRadius: radius.xl, maxHeight: '85%', overflow: 'hidden' },
  page:{padding:24,paddingTop:24,gap:14},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  eyebrow:{color:colors.primary,fontSize:10,fontWeight:'700',letterSpacing:1.4, textTransform: 'uppercase'},
  title:{fontSize:24,fontWeight:'700',color:colors.ink, letterSpacing: -0.5, marginTop: 4},
  close:{color:colors.primary,fontWeight:'700'},
  segments:{flexDirection:'row',gap:8,flexWrap:'wrap'},
  segment:{paddingHorizontal:14,paddingVertical:10,borderRadius:99,borderWidth:1,borderColor:colors.border},
  active:{backgroundColor:colors.primarySoft,borderColor:colors.primary},
  activeText:{color:colors.text,fontWeight:'700'},
  muted:{color:colors.textMuted},
  label:{color:colors.text,fontWeight:'700', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 4},
  input:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14,color:colors.text},
  originRow:{flexDirection:'row',gap:10},
  originCard:{flex:1,minHeight:126,borderRadius:radius.lg,borderWidth:1,borderColor:colors.border,backgroundColor:colors.surface,padding:14,gap:8},
  originCardActive:{borderColor:colors.ink,backgroundColor:colors.mint},
  originTitle:{color:colors.ink,fontSize:15,fontWeight:'700'},
  originBody:{color:colors.textMuted,fontSize:12,lineHeight:17},
  foundationNote:{backgroundColor:colors.butter,borderRadius:radius.lg,padding:15,gap:6},
  existingNote:{backgroundColor:colors.primarySoft},
  foundationKicker:{color:colors.ink,fontSize:10,fontWeight:'800',letterSpacing:1.2},
  foundationBody:{color:colors.textMuted,fontSize:12,lineHeight:18},
  days:{flexDirection:'row',justifyContent:'space-between'},
  day:{width:38,height:38,borderRadius:99,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},
  dayActive:{backgroundColor:colors.primarySoft,borderColor:colors.primary},
  inline:{flexDirection:'row',gap:10},
  toggle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:colors.surface,padding:14,borderRadius:16,borderWidth:1,borderColor:colors.border},
  toggleText:{color:colors.primary,fontWeight:'800'},
  reminder:{backgroundColor:colors.surfaceMuted,padding:14,borderRadius:16},
  reminderText:{color:colors.textMuted,marginTop:4},
  save:{backgroundColor:colors.ink,padding:16,borderRadius:16,alignItems:'center',marginTop:12},
  saveText:{color:'white',fontWeight:'800'}
});
