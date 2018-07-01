const distances = [100, 250, 400, 125, 450, 250, 400, 600, 250, 200, 100, 300, 400, 400];
const totalDistance = distances.reduce( (current, next) => current + next);
const loads = [50, 120, 125, 315, 240, 75, 295, 55, 100, 45, 70, 150, 60];
const kvaL = getKvaL( {loads, distances} );
const kva2 = getKva2( {kvaL, totalDistance} )
const { powerSuppliedByG1, 
        powerSuppliedByG2, 
        halfPointLoads_fromLeft, 
        halfPointDistances_fromLeft 
      } = getHalfPoint( {kva2, loads, distances} );
const kvaL_halfPoint = getKvaL_halfPoint( {halfPointLoads_fromLeft, halfPointDistances_fromLeft} );
// Ring distribution system.
describe('getKvaL()', function() {
 it('should return a value named kvaL', function() {
  expect(kvaL).toEqual(2957375);
 });
});
describe('getKva2()', function() {
 it('should return a value named kva2', function() {
  expect(kva2).toEqual(kvaL / totalDistance);
 });
});
describe('Power supplied by Generator I', function() {
 it('should be around 75.03 Kva', function() {
  expect(powerSuppliedByG1).toBeCloseTo(75.03);
 });
});
describe('Power supplied by Generator II', function() {
 it('should be around 219.97', function() {
  expect(powerSuppliedByG2).toBeCloseTo(219.97);
 });
});
describe('getKvaL_halfPoint()', function() {
  it('should be around 1000683', function() {
    expect(kvaL_halfPoint).toBeCloseTo(1000683.43)
  })
})

function getKvaL({loads, distances}) {
 const kvaL = (function() {
  let total = 0, i = 0;
  const operation = 
  loads.map(function(load) {
   total += distances[i];
   i++;
   return load * total;
  })
  .reduce(function(current, next) {
   return current + next;
  });
  return operation;
 })();
 return kvaL;
};

function getKva2({kvaL, totalDistance}) {
 return (kvaL / totalDistance);
};
// need to make an array with distances according to loads to get KVA * L Halfpoint
function getHalfPoint({kva2, loads, distances}) {
 var halfPointLoads = [],
     halfPointLoads_fromLeft = [...loads],
     halfPointDistances_fromLeft = [...distances],
     powerSuppliedByG1 = 0, 
     powerSuppliedByG2 = 0; 

 Array.prototype.reduceRight.call(loads, function(current, next, index, array) {
  if (current > kva2) {
  powerSuppliedByG1 = Math.abs(kva2 - current);
  halfPointLoads_fromLeft.push(powerSuppliedByG1);
  return;
  };
  if (current <= kva2) {
   halfPointLoads.push(array[index]);
   halfPointDistances_fromLeft.pop();
   halfPointLoads_fromLeft.pop();
  };
  return current + next;
 }, 0);
 halfPointLoads = halfPointLoads.reverse();
 powerSuppliedByG2 = Math.abs(halfPointLoads[0] - powerSuppliedByG1);

 return { halfPointLoads_fromLeft, halfPointDistances_fromLeft, powerSuppliedByG1, powerSuppliedByG2 };
};
// this function is intended to get the kva*l for half point. Needed to calculate the required lead gauge.
  function getKvaL_halfPoint({halfPointLoads_fromLeft, halfPointDistances_fromLeft}) {
    return getKvaL(
      {
        loads: halfPointLoads_fromLeft, 
        distances: halfPointDistances_fromLeft
      }
    ) 
  }
