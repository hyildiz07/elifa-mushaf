// Acoustic candidate gaps only. Human two-sided listening is required before
// any proposed join can be called a verified word boundary.
import {MPEGDecoder} from 'mpg123-decoder';
const url=process.argv[2]||'https://everyayah.com/data/Alafasy_128kbps/060011.mp3';
const res=await fetch(url),bytes=new Uint8Array(await res.arrayBuffer());
const decoder=new MPEGDecoder();await decoder.ready;
try{
  const pcm=decoder.decode(bytes),x=pcm.channelData[0],rate=pcm.sampleRate;
  for(const width of [10,20,40]){
    const n=Math.round(width*rate/1000),levels=[];
    for(let i=0;i+n<=x.length;i+=n){let e=0;for(let j=i;j<i+n;j++)e+=x[j]*x[j];levels.push(Math.sqrt(e/n));}
    const max=Math.max(...levels),quiet=[];
    for(const fraction of [0.02,0.05,0.1]){
      let begin=-1;
      for(let i=0;i<=levels.length;i++){
        if(i<levels.length&&levels[i]<max*fraction){if(begin<0)begin=i;}
        else if(begin>=0){if((i-begin)*width>=150)quiet.push({threshold:fraction,fromMs:begin*width,toMs:i*width,spanMs:(i-begin)*width});begin=-1;}
      }
    }
    console.log(JSON.stringify({widthMs:width,maxRms:max,quiet:quiet.filter(v=>v.threshold===0.1)}));
  }
}finally{await decoder.free();}
