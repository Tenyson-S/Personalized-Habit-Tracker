import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../../services/api';
import { scheduleRecurringTaskReminder, scheduleStartReminder, scheduleWeeklyActivityReminders } from '../../services/reminders';
import { colors, radius, spacing } from '../../theme/tokens';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;
const DAY_LABELS = ['M','T','W','T','F','S','S'];
type Kind='habit'|'daily'|'task';

function localIso(date:string,time:string){
  if(!date || !time) return null;
  const parsed=new Date(`${date}T${time}:00`); return Number.isNaN(parsed.getTime())?null:parsed;
}
export function ActivityComposer({visible,onClose,onSaved}:{visible:boolean;onClose:()=>void;onSaved:()=>void}){
 const [kind,setKind]=useState<Kind>('habit'); const [title,setTitle]=useState(''); const [description,setDescription]=useState('');
 const [days,setDays]=useState<Record<string,boolean>>(Object.fromEntries(DAYS.map(d=>[d,true]))); const [time,setTime]=useState('08:00');
 const [startDate,setStartDate]=useState(new Date().toISOString().slice(0,10)); const [dueDate,setDueDate]=useState(new Date().toISOString().slice(0,10));
 const [dueTime,setDueTime]=useState('18:00'); const [recurring,setRecurring]=useState(false); const [frequency,setFrequency]=useState<'DAILY'|'WEEKLY'|'MONTHLY'>('WEEKLY'); const [saving,setSaving]=useState(false);
 const [scheduleMode,setScheduleMode]=useState<'SELECTED_DAYS'|'WEEKLY_TARGET'>('SELECTED_DAYS'); const [targetPerWeek,setTargetPerWeek]=useState('5');
 const [showStart, setShowStart]=useState<"date"|"time"|null>(null);
 const [showDue, setShowDue]=useState<"date"|"time"|null>(null);
 const schedule=useMemo(()=>Object.fromEntries(DAYS.map(d=>[d,Boolean(days[d])])),[days]);
 function reset(){setKind('habit');setTitle('');setDescription('');setRecurring(false);}
 async function save(){
  if(!title.trim()) return; setSaving(true);
  try{
   if(kind==='habit') await api.post('/habits/',{name:title.trim(),description,habit_type:'BOOLEAN',start_date:startDate,is_active:true,schedule_mode:scheduleMode,target_per_week:scheduleMode==='WEEKLY_TARGET'?Number(targetPerWeek):null,preferred_time:`${time}:00`,reminder_enabled:true,reminder_minutes_before:10,status:'ACTIVE',schedule});
   if(kind==='daily') await api.post('/dailies/',{title:title.trim(),description,start_date:startDate,preferred_time:`${time}:00`,reminder_enabled:true,reminder_minutes_before:10,status:'ACTIVE',schedule});
   if(kind==='task'){
    const starts=localIso(startDate,time); const due=localIso(dueDate,dueTime);
    await api.post('/tasks/',{title:title.trim(),description,priority:'NORMAL',starts_at:starts?.toISOString(),due_at:due?.toISOString(),due_date:dueDate,is_recurring:recurring,reminder_enabled:true,reminder_minutes_before:10,status:'OPEN',recurrence:recurring?{frequency,interval:1,days_of_week:frequency==='WEEKLY'?DAYS.filter(d=>days[d]).map(d=>d.toUpperCase()):[],day_of_month:frequency==='MONTHLY'?Number(dueDate.slice(-2)):null,ends_at:null}:null});
    if(recurring) await scheduleRecurringTaskReminder({ title:title.trim(), time, frequency, days:DAYS.filter(d=>days[d]), dayOfMonth:Number(dueDate.slice(-2)), minutesBefore:10 });
    else if(starts) await scheduleStartReminder({title:title.trim(),startsAt:starts,minutesBefore:10});
   } else {
    if(scheduleMode==='SELECTED_DAYS' || kind==='daily') await scheduleWeeklyActivityReminders({ title:title.trim(), time, days:DAYS.filter(d=>days[d]), minutesBefore:10 });
   }
   reset(); onSaved(); onClose();
  }catch(e:any){Alert.alert('Could not save',e?.response?.data?JSON.stringify(e.response.data):'Nothing was lost. Please try again.');} finally{setSaving(false);}
 }
 return <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}><ScrollView contentContainerStyle={styles.page}>
  <View style={styles.row}><View><Text style={styles.eyebrow}>ADD TO YOUR LIFE</Text><Text style={styles.title}>What are you adding?</Text></View><Pressable onPress={onClose}><Text style={styles.close}>Close</Text></Pressable></View>
  <View style={styles.segments}>{(['habit','daily','task'] as Kind[]).map(k=><Pressable key={k} onPress={()=>setKind(k)} style={[styles.segment,kind===k&&styles.active]}><Text style={kind===k?styles.activeText:styles.muted}>{k[0].toUpperCase()+k.slice(1)}</Text></Pressable>)}</View>
  <Text style={styles.label}>Name</Text><TextInput value={title} onChangeText={setTitle} placeholder={kind==='habit'?'Example: Read regularly':kind==='daily'?'Example: Review tomorrow’s plan':'Example: Finish portfolio API'} style={styles.input}/>
  <Text style={styles.label}>Description (optional)</Text><TextInput value={description} onChangeText={setDescription} multiline style={[styles.input,{minHeight:70}]}/>
  {kind!=='task'?<><Text style={styles.label}>Schedule</Text><View style={styles.segments}><Pressable onPress={()=>setScheduleMode('SELECTED_DAYS')} style={[styles.segment,scheduleMode==='SELECTED_DAYS'&&styles.active]}><Text style={scheduleMode==='SELECTED_DAYS'?styles.activeText:styles.muted}>Selected days</Text></Pressable>{kind==='habit'?<Pressable onPress={()=>setScheduleMode('WEEKLY_TARGET')} style={[styles.segment,scheduleMode==='WEEKLY_TARGET'&&styles.active]}><Text style={scheduleMode==='WEEKLY_TARGET'?styles.activeText:styles.muted}>Days per week</Text></Pressable>:null}</View>{scheduleMode==='WEEKLY_TARGET'&&kind==='habit'?<TextInput value={targetPerWeek} onChangeText={setTargetPerWeek} keyboardType="number-pad" style={styles.input}/>:<View style={styles.days}>{DAYS.map((d,i)=><Pressable key={d} onPress={()=>setDays({...days,[d]:!days[d]})} style={[styles.day,days[d]&&styles.dayActive]}><Text>{DAY_LABELS[i]}</Text></Pressable>)}</View>}</>:null}
  <Text style={styles.label}>{kind==='task'?'Starts':'Preferred time'}</Text>
  <View style={styles.inline}>
    <Pressable onPress={() => setShowStart('date')} style={[styles.input, {flex: 1}]}><Text style={{color:colors.text}}>{startDate}</Text></Pressable>
    <Pressable onPress={() => setShowStart('time')} style={[styles.input, {width: 100}]}><Text style={{color:colors.text}}>{time}</Text></Pressable>
  </View>
  {showStart && <DateTimePicker value={localIso(startDate, time) || new Date()} mode={showStart} is24Hour={true} onChange={(_: any, d?: Date) => {
    setShowStart(null);
    if(d){ if(showStart==='date') setStartDate(d.toISOString().slice(0,10)); else setTime(d.toTimeString().slice(0,5)); }
  }} />}
  
  {kind==='task'?<>
    <Text style={styles.label}>Deadline</Text>
    <View style={styles.inline}>
      <Pressable onPress={() => setShowDue('date')} style={[styles.input, {flex: 1}]}><Text style={{color:colors.text}}>{dueDate}</Text></Pressable>
      <Pressable onPress={() => setShowDue('time')} style={[styles.input, {width: 100}]}><Text style={{color:colors.text}}>{dueTime}</Text></Pressable>
    </View>
    {showDue && <DateTimePicker value={localIso(dueDate, dueTime) || new Date()} mode={showDue} is24Hour={true} onChange={(_: any, d?: Date) => {
      setShowDue(null);
      if(d){ if(showDue==='date') setDueDate(d.toISOString().slice(0,10)); else setDueTime(d.toTimeString().slice(0,5)); }
    }} />}
    <Pressable onPress={()=>setRecurring(!recurring)} style={styles.toggle}><Text style={styles.label}>Recurring task</Text><Text style={styles.toggleText}>{recurring?'Yes':'No'}</Text></Pressable>{recurring?<View style={styles.segments}>{(['DAILY','WEEKLY','MONTHLY'] as const).map(f=><Pressable key={f} onPress={()=>setFrequency(f)} style={[styles.segment,frequency===f&&styles.active]}><Text style={frequency===f?styles.activeText:styles.muted}>{f.toLowerCase()}</Text></Pressable>)}</View>:null}
  </>:null}
  <View style={styles.reminder}><Text style={styles.label}>Reminder</Text><Text style={styles.reminderText}>10 minutes before start time</Text></View>
  <Pressable disabled={saving||!title.trim()} onPress={save} style={styles.save}><Text style={styles.saveText}>{saving?'Saving…':`Create ${kind}`}</Text></Pressable>
 </ScrollView></Modal>
}
const styles=StyleSheet.create({page:{padding:24,paddingTop:34,gap:14,backgroundColor:colors.background},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},eyebrow:{color:colors.primary,fontSize:11,fontWeight:'800',letterSpacing:1.4},title:{fontSize:28,fontWeight:'800',color:colors.text},close:{color:colors.primary,fontWeight:'700'},segments:{flexDirection:'row',gap:8,flexWrap:'wrap'},segment:{paddingHorizontal:14,paddingVertical:10,borderRadius:99,borderWidth:1,borderColor:colors.border},active:{backgroundColor:colors.primarySoft,borderColor:colors.primary},activeText:{color:colors.text,fontWeight:'700'},muted:{color:colors.textMuted},label:{color:colors.text,fontWeight:'700'},input:{backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border,borderRadius:radius.md,padding:14,color:colors.text},days:{flexDirection:'row',justifyContent:'space-between'},day:{width:38,height:38,borderRadius:99,borderWidth:1,borderColor:colors.border,alignItems:'center',justifyContent:'center'},dayActive:{backgroundColor:colors.primarySoft,borderColor:colors.primary},inline:{flexDirection:'row',gap:10},toggle:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:colors.surface,padding:14,borderRadius:16,borderWidth:1,borderColor:colors.border},toggleText:{color:colors.primary,fontWeight:'800'},reminder:{backgroundColor:colors.surfaceMuted,padding:14,borderRadius:16},reminderText:{color:colors.textMuted,marginTop:4},save:{backgroundColor:colors.primary,padding:16,borderRadius:16,alignItems:'center',marginTop:8},saveText:{color:'white',fontWeight:'800'}});
