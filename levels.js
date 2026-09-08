const circuits=[
  {
    id:'midnight',number:'01',name:'MIDNIGHT CIRCUIT',mark:'夜 / 侵入',theme:'DISTRICT 09 // NIGHTFALL',tagline:'Six districts. Three laps. One continuous line.',promise:'Hold the slide. Own the night.',mission:'Link the market sweepers, thread the Glasshouse columns, chase the maglev, and bank your chain before the dockside wall takes it.',brief:'Build one unbroken line.',briefBody:'Finish three long laps through the city against three rivals. The open Glasshouse and the Maglev Spine reward commitment without forgiving contact.',setpieceCue:'MAGLEV INBOUND',rankBands:[10000,20000,30000],accent:'#6bffeb',accent2:'#ff4f92',sky:0x070d22,fog:0x091329,ground:0x070e1b,road:0x182538,edgeA:0xff408c,edgeB:0x50fff1,grip:1,topSpeed:66,pace:1,record:'neon-midnight',
    control:[[-65,3,180],[60,3,180],[175,6,150],[260,18,55],[270,26,-80],[190,23,-165],[95,14,-145],[25,6,-215],[-80,3,-260],[-205,4,-330],[-350,7,-300],[-425,9,-205],[-405,8,-85],[-330,6,-15],[-250,5,45],[-315,12,125],[-300,18,240],[-190,12,285],[-170,5,190]],
    districts:[['NEON MARKET','Open straight · build speed'],['SKYWAY','Elevated sweep · hold your line'],['UNDERPASS','S-bends · brake and drift'],['GLASSHOUSE','Open atrium · thread the columns'],['MAGLEV SPINE','Rail chase · link the sweepers'],['DOCKSIDE','Final hairpin · bank the chain']],
    driftZones:[.08,.235,.39,.555,.735,.91]
  },
  {
    id:'solara',number:'02',name:'SOLARA RUN',mark:'日 / 疾走',theme:'HELIOS BASIN // GOLDEN HOUR',tagline:'Solar fields. Canyon walls. A dying star.',promise:'Ride the heat. Break the horizon.',mission:'Sweep through the mirror fields, cut under the broken aqueduct, and hold a wide arc while the solar crown turns above the basin.',brief:'Chase the last light.',briefBody:'A fast, open desert circuit built around long drifts and late braking. The sand has less grip, but the wide basin rewards fearless angle.',setpieceCue:'SOLAR CROWN / ROTATION LIVE',rankBands:[8000,16000,24000],accent:'#ffd166',accent2:'#ff643d',sky:0x321a28,fog:0x8a4935,ground:0x5a2e25,road:0x352d32,edgeA:0xff5b36,edgeB:0xffd166,grip:.88,topSpeed:70,pace:1.04,record:'neon-solara',
    control:[[-150,4,170],[-10,5,220],[145,8,190],[275,12,95],[330,17,-55],[260,10,-190],[120,5,-260],[-45,3,-245],[-165,12,-175],[-300,21,-85],[-355,24,55],[-290,16,120]],
    districts:[['SUN GATE','Launch straight · chase the light'],['MIRROR FIELD','Long arc · keep the throttle open'],['DUST CHANNEL','Loose grip · patient countersteer'],['BROKEN AQUEDUCT','Stone ribs · narrow line'],['SOLAR CROWN','Thread the pylons · commit late'],['EMBER MESA','Fast descent · bank before home']],
    driftZones:[.105,.27,.43,.59,.76,.91]
  },
  {
    id:'cryoline',number:'03',name:'CRYOLINE ZERO',mark:'氷 / 零度',theme:'BOREAL TERMINAL // WHITEOUT',tagline:'Black ice. Aurora sky. Zero margin.',promise:'Stay cold. Cut clean.',mission:'Carve the glacier switchbacks, cross the fractured ice port, and race the launch crawler beneath a living aurora.',brief:'Master the frozen edge.',briefBody:'The technical circuit. Low grip extends every slide, barriers close in through the ice vault, and the final launch yard demands a clean exit.',setpieceCue:'LAUNCH CRAWLER CROSSING',rankBands:[8500,17000,25500],accent:'#8de8ff',accent2:'#a983ff',sky:0x07172b,fog:0x244d65,ground:0xb8d9df,road:0x263b50,edgeA:0xa983ff,edgeB:0x8de8ff,grip:.72,topSpeed:63,pace:.96,record:'neon-cryoline',
    control:[[-65,5,170],[70,4,180],[180,3,110],[205,6,-10],[155,14,-115],[50,22,-155],[-75,18,-120],[-155,8,-210],[-285,3,-185],[-330,4,-60],[-260,10,35],[-330,18,135],[-235,25,245],[-190,12,180]],
    districts:[['ICE PORT','Measured start · find the grip'],['AURORA REACH','Wide sweeper · float the rear'],['GLACIER CUT','Switchbacks · shorten the slide'],['ICE VAULT','Blue tunnel · mind the pillars'],['LAUNCH YARD','Crawler crossing · stay alert'],['POLAR DESCENT','Falling esses · clean exit']],
    driftZones:[.08,.22,.375,.54,.72,.895]
  }
];
const requested=typeof location==='undefined'?null:new URLSearchParams(location.search).get('level');
export const level=circuits.find(c=>c.id===requested||c.number===requested)||circuits[0];
export {circuits};
