export const BOOST_MAX=100;

export function boostFromBank(score){
  return Math.min(32,Math.max(0,Math.sqrt(Math.max(0,score))*.48));
}

export function spendBoost(charge,dt){
  return Math.max(0,charge-Math.max(0,dt)*26);
}
