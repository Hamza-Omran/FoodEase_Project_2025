const { v4: uuidv4 } = require('uuid');
const reviews = [];
module.exports = {
add: async (r)=>{ r.id = uuidv4(); reviews.push(r); return r; },
listByRestaurant: async (rid)=> reviews.filter(x=>x.restaurantId===rid)
}