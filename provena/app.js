'use strict';
const el = id => document.getElementById(id);
const states={active:'有効な登録記録',revoked:'失効した証明書です',superseded:'再発行により旧証明書となっています'};
function field(label,value){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value ?? '未記録';el('fields').append(dt,dd);}
async function lookup(){
  el('record').hidden=true;el('test').hidden=true;el('fields').replaceChildren();
  const id=new URL(location.href).searchParams.get('id');
  if(!id){el('message').textContent='証明書のQRコードを読み込むか、証明書IDを入力してください。';return;}
  if(!/^(TEST-CERT|CERT)-[a-f0-9]{32}$/.test(id)){el('message').textContent='証明書IDの形式を確認してください。';return;}
  el('certificate').value=id;
  try{
    const response=await fetch('registry.json',{cache:'no-store'});
    if(!response.ok)throw new Error('network');
    const data=await response.json();
    const r=Object.hasOwn(data.records,id)?data.records[id]:null;
    if(!r){el('message').textContent='この公開台帳に登録記録が見つかりません。発行元に確認してください。';return;}
    el('test').hidden=!r.test;
    el('message').textContent=r.test?'試験用の台帳で照合しました。':'公開台帳に一致する登録記録があります。';
    el('title').textContent=r.title;el('artist').textContent=r.artist+' / '+r.series;
    // Exporter only produces content-addressed local PNG paths. No arbitrary URL.
    if(!/^images\/[a-f0-9]{64}\.png$/.test(r.image))throw new Error('image');
    el('image').src=r.image;
    field('作品ID',r.work_id);field('証明書ID',r.certificate_id);
    field('証明書区分',r.kind==='edition'?'エディション登録証明':'作品登録証明');
    if(r.kind==='edition')field('エディション',r.edition_number+' / '+r.edition_total+(r.test?'（試験用の仮値）':''));
    field('制作年・作品仕様',r.year+' / '+r.specification);
    field('登録日時',r.registered_at);field('発行日時',r.issued_at);field('発行主体',r.issuer);
    field('SHA-256（指定マスターデータ）',r.sha256);field('証明書PDFのSHA-256',r.pdf_sha256);
    field('TSA',r.tsa_status==='verified'?'署名・データ照合済 / '+r.tsa_time:'未取得 / 時刻証明なし');
    if(r.superseded_by)field('後継証明書ID',r.superseded_by);
    el('state').textContent=states[r.status]||'発行状態不明';
    el('exported').textContent='台帳出力日時：'+data.exported_at;
    el('record').hidden=false;
  }catch(error){el('record').hidden=true;el('message').textContent='台帳を取得できません。時間を置いて再確認してください。有効性は確認できていません。';}
}
el('lookup').addEventListener('submit',event=>{event.preventDefault();const u=new URL(location.href);u.searchParams.set('id',el('certificate').value.trim());history.replaceState(null,'',u);lookup();});
lookup();
