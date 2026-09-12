// Approved character lineup. Two consecutive workouts share one trainer.
export const trainerRoster=[
 {id:'05',description:'Cream shirt, forest shorts'},
 {id:'02',description:'Braided ponytail, forest tank, orange leggings'},
 {id:'01',description:'Teal shirt, dark joggers'},
 {id:'04',description:'Auburn ponytail, burgundy jacket'},
 {id:'03',description:'Black tank, olive shorts'},
 {id:'06',description:'Forest turban, orange shirt'}
];
export function trainerForWorkout(number){if(!Number.isInteger(number)||number<1)throw new RangeError('Workout number must be a positive integer.');return trainerRoster[Math.floor((number-1)/2)%trainerRoster.length];}
