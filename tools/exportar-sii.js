// Ejecutar desde la consola del SII, con la sesión iniciada.
// Solo consulta los listados; no modifica el SII. No envía datos a otros servidores.
(async()=>{
 if(location.origin!=='https://www.mexicomfc.net')throw Error('Ejecuta este código en https://www.mexicomfc.net');
 const raw=prompt('Pega el Request URL del listado que quieres exportar (Jóvenes o Adolescentes).');if(!raw)return;
 const url=new URL(raw);if(url.origin!==location.origin||!/^\/api\/membresia\/listar\/\d+\/$/.test(url.pathname))throw Error('URL de listado inválida.');
 const tipo=prompt('Tipo de este listado: joven o adolescente','joven')?.trim().toLowerCase();if(!['joven','adolescente'].includes(tipo))throw Error('Tipo inválido.');
 url.searchParams.set('buscar','');url.searchParams.set('pageSize','100');url.searchParams.set('page','1');
 // Si el listado usa Authorization, introduce su valor solo en este diálogo local.
 // No se imprime ni se guarda en el archivo exportado.
 const authorization=prompt('Si Request Headers incluye Authorization, pega aquí su valor completo; si usa cookies, deja vacío.')||'';
 const rows=[],ids=new Set();let expected=null;
 for(let page=1;page<=1000;page++){
 url.searchParams.set('page',String(page));const response=await fetch(url,{credentials:'same-origin',headers:authorization?{Authorization:authorization}:{}});
 if(!response.ok)throw Error(`Consulta detenida: HTTP ${response.status}. No se descargó un archivo parcial.`);
 const json=await response.json();if(!Array.isArray(json.data)||!Number.isFinite(Number(json.total)))throw Error('Respuesta inesperada; revisa Preview.');
 if(expected===null)expected=Number(json.total);if(Number(json.total)!==expected)throw Error('El listado cambió durante la descarga; vuelve a intentarlo.');
 let added=0;for(const p of json.data){if(p.membresia_id==null)throw Error('Registro sin membresia_id.');const id=String(p.membresia_id);if(!ids.has(id)){ids.add(id);rows.push(p);added++}}
 console.info(`Página ${page}: ${rows.length} de ${expected}`);
 if(rows.length===expected)break;if(!added||!json.data.length)throw Error('Paginación incompleta; no se guardó un archivo parcial.');
 await new Promise(r=>setTimeout(r,400));
 }
 if(rows.length!==expected)throw Error('Total incompleto.');
 const download=(name,content,type)=>{const u=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),5000)};
 download(`sii-${tipo}-completo.json`,JSON.stringify({tipo,total:rows.length,exportado:new Date().toISOString(),filtros:Object.fromEntries([...url.searchParams].filter(([k])=>!['page','pageSize'].includes(k))),data:rows},null,2),'application/json');
 const escape=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 // No se inventa un campo de foto: se agregará cuando confirmemos su nombre en el SII.
 const csv=[['mfc_id','nombre','sector','rol','tipo','foto'],...rows.map(p=>[p.membresia_id,p.nombre_completo,p.sector,p.rol,tipo,''])].map(r=>r.map(escape).join(',')).join('\r\n');
 download(`sii-${tipo}-directorio.csv`,'\ufeff'+csv,'text/csv;charset=utf-8');console.info(`Exportación completa: ${rows.length} ${tipo}. Se conservaron los filtros y permisos de la URL.`);
})().catch(e=>console.error(e.message));
