/* Workout exercise name -> Iron Archive card number.
   Used only for navigation (thumbnails / "see card" links). Logs are never copied either way. */
window.SPYR_EXERCISE_CARDS = {
  'Bench Press':'001','Barbell Bench Press':'001','T-Bar Row':'002','Incline Bench':'003','Incline Bench Press':'003','Incline Barbell Press':'003',
  'Weighted Pull-up':'004','Pull-ups':'004','Pull-up':'004','Dumbbell Fly':'005','Flat Dumbbell Fly':'005','Dumbbell Row':'006','One-Arm Dumbbell Row':'006',
  'Seated Dumbbell Press':'007','Dumbbell Shoulder Press':'007','Dumbbell Snatch':'008','Zercher Squat':'009','Hammer Curl':'011','Lateral Raise':'012',
  'Dumbbell Lateral Raise':'012','Split Jerk':'013','Farmer\'s Carry':'014','Farmers Carry':'014','Bicep Curl':'015','Barbell Curl':'015',
  'Walking Lunge':'016','Lunges':'016','Bulgarian Split Squat':'017','Squat':'018','Back Squat':'018','Barbell Squat':'018','Hip Thrust':'019',
  'Standing Calf Raise':'020','Calf Raise':'020','Deadlift':'021','Lat Pulldown':'022','Face Pull':'023','Overhead Press':'024','Dips':'025',
  'Hanging Leg Raise':'026','Ab Wheel':'027','Pallof Press':'028','Side Plank':'029','Cossack Squat':'030','Step-up':'031','Skull Crusher':'032',
  'Push-up':'033','Push-ups':'033','Chest-Supported Row':'034','Rear Delt Fly':'035','Reverse Fly':'035','Romanian Deadlift':'036','Sled Push':'037',
  'Trap Bar Deadlift':'038','Leg Press':'039','Leg Curl':'040','Lying Leg Curl':'040','Seated Leg Curl':'040','Leg Extension':'041','Goblet Squat':'042',
  'Front Squat':'043','Sumo Deadlift':'044','Single-Leg RDL':'045','Glute Bridge':'046','Seated Calf Raise':'047','Barbell Row':'048',
  'Seated Cable Row':'049','Chin-up':'050','Chin-ups':'050','Inverted Row':'051','Straight-Arm Pulldown':'052','Shrug':'053','Barbell Shrug':'053',
  'Close-Grip Bench Press':'054','Tricep Pushdown':'055','Triceps Pushdown':'055','Overhead Tricep Extension':'056','Incline Dumbbell Curl':'057',
  'Preacher Curl':'058','Arnold Press':'059','Arnold-style Press':'059','Pec Deck':'060','Pec Deck Fly':'060','Dumbbell Zercher Squat':'010','Landmine Press':'061',
  'Kettlebell Swing':'062','Turkish Get-up':'063','Dead Bug':'064','Suitcase Carry':'065'
};

/* v52.52: what Workout needs to file a deck card's sets. Deck exercises stay separate from the regular Workout
   exercises (they're fixed variations with their own PRs); "base" only lends the muscles for recovery.
   [base Workout exercise, or null with own muscles: [main, helpers]] */
window.SPYR_CARD_WORKOUT = {
  '001':'Bench Press','002':'T-Bar Row','003':'Incline Bench','004':'Pull-ups','005':'Dumbbell Fly','006':'Dumbbell Row','007':'Dumbbell Shoulder Press',
  '008':['Shoulders','Glutes,Quads,Back,Traps'],'009':['Quads','Glutes,Core,Back'],'010':['Quads','Glutes,Core'],'011':'Hammer Curl','012':'Lateral Raise',
  '013':['Shoulders','Quads,Glutes,Triceps'],'014':"Farmer's Carry",'015':'Barbell Curl','016':'Walking Lunge','017':'Bulgarian Split Squat','018':'Squat',
  '019':'Hip Thrust','020':'Standing Calf Raise','021':'Chain Deadlift','022':'Lat Pulldown','023':'Face Pull','024':'Overhead Press','025':'Dips',
  '026':'Hanging Leg Raise','027':'Ab Wheel','028':['Core',''],'029':['Core','Glutes,Shoulders'],'030':['Quads','Glutes'],'031':['Quads','Glutes'],
  '032':'Skull Crusher','033':'Push-up','034':['Back','Biceps'],'035':'Rear Delt Fly','036':'Romanian Deadlift','037':['Quads','Glutes,Calves'],
  '038':['Back','Glutes,Quads,Hamstrings,Traps'],'039':'Leg Press','040':'Seated Leg Curl','041':'Leg Extension','042':'Goblet Squat','043':'Front Squat',
  '044':['Glutes','Quads,Hamstrings,Back'],'045':['Hamstrings','Glutes'],'046':'Glute Bridge','047':'Seated Calf Raise','048':'Barbell Row',
  '049':'Seated Cable Row','050':'Chin-up','051':['Back','Biceps'],'052':'Straight-arm Pulldown','053':'Shrug','054':'Close-grip Bench',
  '055':'Tricep Pushdown','056':'Tricep Ext','057':'Incline Curl','058':'Preacher Curl','059':'Arnold-style Press','060':'Pec Deck',
  '061':['Shoulders','Chest,Triceps'],'062':['Glutes','Hamstrings,Back'],'063':['Core','Shoulders,Glutes'],'064':['Core',''],'065':['Core','Forearms,Traps']
};
