import assert from 'node:assert/strict';
import {eligible} from '../lib/attendance-rules.ts';
assert(eligible({type:'joven',role:'Promotor'},{audience:'general',role_filter:''}));
assert(eligible({type:'joven',role:'PROMOTOR'},{audience:'joven',role_filter:'Promotor'}));
assert(!eligible({type:'adolescente',role:'Promotor'},{audience:'joven',role_filter:'Promotor'}));
assert(!eligible({type:'joven',role:'Integrante'},{audience:'general',role_filter:'Promotor'}));
assert(!eligible({},{audience:'adolescente',role_filter:''}));
console.log('Filtros general, tipo, rol y datos faltantes: correctos');
