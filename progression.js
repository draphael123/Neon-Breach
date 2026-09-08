export const medalNames=['OPEN','BRONZE','SILVER','GOLD'];

export function earnedLicense(rank,place){
  if(rank==='S'||rank==='A'&&place===1)return 3;
  if(['A','B'].includes(rank)&&place<=3)return 2;
  return 1;
}

export function licenseTitle(licenses){
  const classified=licenses.filter(Boolean).length;
  return licenses.every(value=>value===3)?'BREACH MASTER':classified+'/'+licenses.length+' CLASSIFIED';
}
