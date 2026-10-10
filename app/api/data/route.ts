import {eligible} from '../../../lib/attendance-rules';
import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
const str=(x:unknown,max=160)=> typeof x==='string'?x.trim().slice(0,max):'';
export async function GET(){if(!await getChatGPTUser())return Response.json({error:'Inicia sesión.'},{status:401}); const db=env.DB!;const rows=await Promise.all(['events','controls','people','attendance'].map(t=>db.prepare(`SELECT * FROM ${t}`).all()));return Response.json(Object.fromEntries(['events','controls','people','attendance'].map((t,i)=>[t,rows[i].results])));}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'Inicia sesión.'},{status:401});
 if(req.headers.get('origin')!==new URL(req.url).origin)return Response.json({error:'Origen inválido.'},{status:403});
 try{const b:any=await req.json();const db=env.DB!;
 if(b.action==='event'){
 const name=str(b.name),mode=str(b.mode);if(!name||!['simple','inout','sessions'].includes(mode))throw Error('Revisa el nombre y modalidad.');
 const days=[...new Set<string>(b.days)];if(!days.length||days.length>60||days.some(d=>!/^\d{4}-\d{2}-\d{2}$/.test(d)||new Date(d).toISOString().slice(0,10)!==d))throw Error('Fechas inválidas.');
 const labels=mode==='simple'?['Asistencia']:mode==='inout'?['Entrada','Salida']:b.labels.map((x:unknown)=>str(x,60)).filter(Boolean);if(!labels.length||labels.length>12||new Set(labels).size!==labels.length)throw Error('Define entre 1 y 12 sesiones sin nombres repetidos.');
 const audience=str(b.audience)||'general';if(!['general','joven','adolescente'].includes(audience))throw Error('Tipo de evento inválido.');const role=str(b.roleFilter);const id=crypto.randomUUID();await db.batch([db.prepare('INSERT INTO events(id,name,mode,audience,role_filter) VALUES(?,?,?,?,?)').bind(id,name,mode,audience,role),...days.flatMap(day=>labels.map((label:string,i:number)=>db.prepare('INSERT INTO controls VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),id,day,label,mode==='inout'?(i===0?'entry':'exit'):'present',i)))]);
 }else if(b.action==='people'){
 if(!Array.isArray(b.people)||!b.people.length||b.people.length>500)throw Error('Máximo 500 personas por importación.');
 const stmts=b.people.map((p:any)=>{const name=str(p.name),mfc=str(p.mfc,20).replace(/^MFCID-/i,'');if(!name||mfc&&!/^\d+$/.test(mfc))throw Error('Nombre o ID inválido.');const type=str(p.type).toLowerCase();if(!['','joven','adolescente'].includes(type))throw Error('Tipo válido: joven o adolescente.');const photo=str(p.photo,100000);if(photo&&!/^https:\/\//.test(photo)&&!/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photo))throw Error('Foto inválida. Usa HTTPS o una imagen JPG/PNG/WebP.');return db.prepare('INSERT INTO people(id,mfc,name,sector,source,role,type,photo) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(mfc) DO UPDATE SET name=excluded.name,sector=excluded.sector,role=excluded.role,type=excluded.type,photo=excluded.photo').bind(crypto.randomUUID(),mfc||null,name,str(p.sector),mfc?'directorio':'provisional',str(p.role),type,photo);});await db.batch(stmts);
 }else if(b.action==='delete'){const id=str(b.id);await db.batch([db.prepare('DELETE FROM attendance WHERE control IN (SELECT id FROM controls WHERE event=?)').bind(id),db.prepare('DELETE FROM controls WHERE event=?').bind(id),db.prepare('DELETE FROM events WHERE id=?').bind(id)]);
 }else if(b.action==='configure'){const audience=str(b.audience)||'general';if(!['general','joven','adolescente'].includes(audience))throw Error('Tipo inválido.');await db.prepare('UPDATE events SET audience=?,role_filter=? WHERE id=?').bind(audience,str(b.roleFilter),str(b.id)).run();
 }else if(b.action==='close'){await db.prepare('UPDATE events SET closed=? WHERE id=?').bind(b.closed?1:0,str(b.id)).run();
 }else if(b.action==='check'){
 const c:any=await db.prepare('SELECT controls.*,events.closed,events.audience,events.role_filter FROM controls JOIN events ON events.id=controls.event WHERE controls.id=?').bind(str(b.control)).first();if(!c||c.closed)throw Error('El evento está cerrado o no existe.');
 const person:any=await db.prepare('SELECT * FROM people WHERE id=?').bind(str(b.person)).first();if(!person)throw Error('Persona no encontrada.');if(!eligible(person,c))throw Error('El rol o tipo del participante no cumple los filtros del evento.');
 if(c.kind==='exit'&&!await db.prepare("SELECT attendance.id FROM attendance JOIN controls ON attendance.control=controls.id WHERE attendance.person=? AND controls.event=? AND controls.day=? AND controls.kind='entry'").bind(b.person,c.event,c.day).first())throw Error('Primero registra la entrada de este día.');
 const r=await db.prepare('INSERT OR IGNORE INTO attendance VALUES(?,?,?,?,?,?)').bind(crypto.randomUUID(),str(b.person),c.id,new Date().toISOString(),b.method==='qr'?'qr':'manual',user.userId).run();if(!r.meta.changes)throw Error('Esta persona ya está registrada en este control.');
 }else throw Error('Acción inválida.');return Response.json({ok:true});
 }catch(e){return Response.json({error:e instanceof Error?e.message:'No se pudo guardar.'},{status:400});}}
