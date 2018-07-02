const gauges = {
 "copper": {
  "N6": {
   "2400": 2.5950e-2,
   "13800": 0.7850e-3,
   "34500": 0.1260e-3
  },
  "N4": {
   "2400": 1.8120e-2,
   "13800": 0.5480e-3,
   "34500": 0.0870e-3,
  },
  "N2": {
   "2400": 1.3260e-2,
   "13800": 0.4010e-3,
   "34500": 0.0642e-3 
  },
  "N1": {
   "2400": 1.1440e-2,
   "13800": 0.3460e-3,
   "34500": 0.0554e-3 
  },
  "N10": {
   "2400": 0.9990e-2,
   "13800": 0.3020e-3,
   "34500": 0.0484e-3
  },
  "N20": {
   "2400": 0.8830e-2,
   "13800": 0.2670e-3,
   "34500": 0.0428e-3
  },
  "N30": {
   "2400": 0.7870e-2,
   "13800": 0.2380e-3,
   "34500": 0.0381e-3
  },
  "N40": {
   "2400": 0.7080e-2,
   "13800": 0.2140e-3,
   "34500": 0.0343e-3 
  }
 },

 "aluminium": {
  "N4": {
   "2400": 2.9230e-2,
   "13800": 0.8840e-3,
   "34500": 0.1420e-3 
  },
  "N2": {
   "2400": 2.0100e-2,
   "13800": 0.6080e-3,
   "34500": 0.0973e-3
  },
  "N10": {
   "2400": 1.4280e-2,
   "13800": 0.4320e-3,
   "34500": 0.0682e-3
  },
  "N20": {
   "2400": 1.2230e-2,
   "13800": 0.3700e-3,
   "34500": 0.0592e-3
  },
  "N30": {
   "2400": 1.0580e-2,
   "13800": 0.3200e-3,
   "34500": 0.0512e-3
  },
  "N40": {
   "2400": 0.9260e-2,
   "13800": 0.2800e-3,
   "34500": 0.0448e-3
  }
 }
}
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
const selectedVoltageSource = '13800'
const { forCopper, forAluminium } = getGauges(gauges, kvaL_halfPoint, selectedVoltageSource);
console.log(forCopper, forAluminium)
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
});
describe('Copper conductor requirement', function() {
 describe('Selected Voltage Level', function() {
  it('should be 13800', function() {
   expect(forCopper.voltage).toBe(13800);
  });
  describe('Selected factor', function() {
   it('should be 0.0007850', function() {
    expect(forCopper.factor).toBe(0.0007850);
   })
  });
 });
 describe('%V', function() {
  it('Should be around 0.78', function() {
   expect(forCopper.vpercent).toBeCloseTo(0.78553);
  }) 
 });
 it('should be #6', function() {
  expect(forCopper.gauge).toBe('N6');
 });
});
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

function getKvaL_halfPoint({halfPointLoads_fromLeft, halfPointDistances_fromLeft}) {
  return getKvaL({
      loads: halfPointLoads_fromLeft, 
      distances: halfPointDistances_fromLeft
    });
}

function getGauges(gauges, kvaL_halfPoint, selectedVoltageSource) {
 var copper = gauges.copper;
 var aluminium = gauges.aluminium;
 var determineGauges = function(materialName, materialObj) {
  for (let gauge in materialObj) {
   for (let voltage in materialObj[gauge]) {
    if (selectedVoltageSource == voltage) {
     let vpercent = ( (kvaL_halfPoint * Math.pow(10, -3)) * materialObj[gauge][voltage] );
     if (vpercent < 1) {
      return {
       'material': materialName,
       'voltage': parseInt(voltage, 10),
       'factor': materialObj[gauge][voltage],
       'vpercent': vpercent,
       'gauge': gauge
      };
     };
    };
   };
  };
 };
 return {
  forCopper: determineGauges('copper', copper),
  forAluminium: determineGauges('aluminium', aluminium)
 };
}
