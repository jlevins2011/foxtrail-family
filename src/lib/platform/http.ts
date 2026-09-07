import {Problem} from './model';
export async function readJson(request:Request,maximum=700000):Promise<Record<string,unknown>>{
 if(Number(request.headers.get('content-length')??0)>maximum)throw new Problem('This file is too large.',413);
 const reader=request.body?.getReader();if(!reader)return {};const decoder=new TextDecoder();let size=0,raw='';try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>maximum){await reader.cancel();throw new Problem('This file is too large.',413)}raw+=decoder.decode(value,{stream:true})}raw+=decoder.decode();}finally{reader.releaseLock()}
 try{const data=raw?JSON.parse(raw):{};if(!data||typeof data!=='object'||Array.isArray(data))throw new Error('Invalid object');return data;}catch{throw new Problem('Provide a valid JSON object.')}
}
