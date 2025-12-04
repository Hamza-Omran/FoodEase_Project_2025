const { v4: uuidv4 } = require('uuid');
const restaurants = [];
module.exports = {
list: async ()=> restaurants,
get: async (id)=> restaurants.find(r=>r.id===id),
create: async (r)=>{ r.id = uuidv4(); restaurants.push(r); return r; },
update: async (id,patch)=>{ const r = restaurants.find(x=>x.id===id); if(!r) throw new Error('Not found'); Object.assign(r,patch); return r; },
remove: async (id)=>{ const idx = restaurants.findIndex(x=>x.id===id); if(idx>=0) restaurants.splice(idx,1); }
}