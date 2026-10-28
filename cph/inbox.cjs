'use strict';
const {randomUUID}=require('node:crypto');
/** Bounded queue: preserves problem payloads received while renderer is reloading. */
function createInbox(limit=40){
 const queue=new Map();
 return {
  push(problem){const id=randomUUID();queue.set(id,{...problem,deliveryId:id});while(queue.size>limit)queue.delete(queue.keys().next().value);return queue.get(id);},
  pending(){return Array.from(queue.values());},
  ack(id){return queue.delete(String(id));},
  get size(){return queue.size;}
 };
}
module.exports={createInbox};
