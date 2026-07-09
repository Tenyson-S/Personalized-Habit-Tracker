import React from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Card } from '../../components/Card';
import { colors } from '../../theme/tokens';
export function ActivityManager({onChanged}:{onChanged:()=>void}){
 const habits=useQuery({queryKey:['manage-habits'],queryFn:async()=>(await api.get('/habits/')).data});
 const dailies=useQuery({queryKey:['manage-dailies'],queryFn:async()=>(await api.get('/dailies/')).data});
 const tasks=useQuery({queryKey:['manage-tasks'],queryFn:async()=>(await api.get('/tasks/')).data});
 async function changeState(type:'habits'|'dailies'|'tasks',item:any){
   if(type==='habits') await api.patch(`/habits/${item.id}/`,{status:item.status==='PAUSED'?'ACTIVE':'PAUSED',is_active:item.status==='PAUSED'});
   if(type==='dailies') await api.patch(`/dailies/${item.id}/`,{status:item.status==='PAUSED'?'ACTIVE':'PAUSED'});
   if(type==='tasks') await api.patch(`/tasks/${item.id}/`,{status:'ARCHIVED'});
   onChanged();
 }
 async function remove(type:'habits'|'dailies'|'tasks',id:string,title:string){Alert.alert('Delete?',`Remove “${title}”?`,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:async()=>{await api.delete(`/${type}/${id}/`);onChanged();}}]);}
 const sections=[['Habits',habits.data??[],'habits'],['Dailies',dailies.data??[],'dailies'],['Tasks',tasks.data??[],'tasks']] as const;
 return <Card><Text style={styles.title}>Manage activities</Text><Text style={styles.muted}>Create, review, and remove what no longer belongs.</Text>{sections.map(([label,items,type])=><View key={label} style={styles.section}><Text style={styles.label}>{label}</Text>{items.length===0?<Text style={styles.muted}>None yet.</Text>:items.slice(0,8).map((item:any)=><View key={item.id} style={styles.row}><View style={{flex:1}}><Text style={styles.item}>{item.name??item.title}</Text><Text style={styles.meta}>{(item.life_area??'').replaceAll('_',' ')}</Text></View><View style={styles.actions}><Pressable onPress={()=>changeState(type,item)}><Text style={styles.pause}>{type==='tasks'?'Archive':item.status==='PAUSED'?'Resume':'Pause'}</Text></Pressable><Pressable onPress={()=>remove(type,item.id,item.name??item.title)}><Text style={styles.delete}>Delete</Text></Pressable></View></View>)}</View>)}</Card>
}
const styles=StyleSheet.create({title:{fontSize:18,fontWeight:'800',color:colors.text},muted:{color:colors.textMuted},section:{gap:8,marginTop:12},label:{fontSize:12,fontWeight:'800',letterSpacing:1,color:colors.primary},row:{flexDirection:'row',alignItems:'center',paddingVertical:7,borderTopWidth:1,borderTopColor:colors.border},item:{fontWeight:'700',color:colors.text},meta:{fontSize:11,color:colors.textMuted},actions:{flexDirection:'row',gap:12},pause:{color:colors.primary,fontWeight:'700'},delete:{color:colors.danger,fontWeight:'700'}});
