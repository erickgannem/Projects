"use strict";
window.addEventListener('DOMContentLoaded', function() {
 const addBranchesEl = document.querySelector('button#branch-submit');
 const branchInputEl = document.querySelector('input#branch-input');
 const distanceSectionEl = document.querySelector('div#distances');
 const distancesEl = Array.from(document.querySelectorAll('div.distance-input'));
 const distanceBoxesEl = document.querySelector('div.distance-boxes');
 const branchSectionEl = document.querySelector('#branches-wrapper');
 const calculateEl = document.querySelector('button.btn-calculate');
 const typeRadioEls = document.querySelectorAll('input.type-radio');
 const voltageRadioEls = document.querySelectorAll('input.voltage-radio');
 const leftSectionEl = document.querySelector('div.left-panel');
 let selectedVoltageSource = null;
 let selectedSystemType = null; 
 let branchInputElValue = null;
 let running = false; 
 
 // Functions
 function runApp() {
  const branchesQty = branchInputEl.value;
  const branchesObj = generateBranchObjects(branchesQty);
  const infoMessage = {
   'Selected System Type': selectedSystemType,
   'Voltage Level': selectedVoltageSource,
   'Branches': branchInputElValue
  };
  if (running) { alert('Please, reload the page in order to refresh the application'); return };
  if (!selectedVoltageSource && !selectedSystemType) { alert('Please check a voltage level and a distribution system type'); return; };
  if (!selectedVoltageSource) { alert('Please, check a voltage level'); return; };
  if (!selectedSystemType) { alert('Please, check a distribution system type'); return; };
  if (!branchInputElValue) { alert('Please, fill in the branches input');  return; };

  renderDistanceBoxes(generateDistanceBoxes());
  renderBranchBoxes(branchesObj);
  generateNewLoadBox(branchesObj);

  running = true;
  console.log(infoMessage);
 };
 
 function calculate() {
  if (!running) return;
  // Common tasks for ring and radial
  const { distances, totalDistance } = getDistanceValues();
  const { loads } = getLoadValues();
  const kvaL = getKvaL( {loads, distances} );

  if (selectedSystemType == 'ring') {
   forRing({ selectedVoltageSource, gauges, kvaL, loads, distances, totalDistance });
  };
  if (selectedSystemType == 'radial') {
   forRadial({ selectedVoltageSource, gauges, kvaL, totalDistance });
  };
  function forRing({ selectedVoltageSource, gauges, kvaL, loads, distances, totalDistance }) {
   const kva2 = getKva2( {kvaL, totalDistance} );
   const { powerSuppliedByG1, 
           powerSuppliedByG2, 
           halfPointLoads_fromLeft, 
           halfPointDistances_fromLeft 
         } = getHalfPoint( {kva2, loads, distances} );
   const kvaL_halfPoint = getKvaL_halfPoint( {halfPointLoads_fromLeft, halfPointDistances_fromLeft} );
   const { forCopper, forAluminium } = getGauges({ gauges, kvaL_needed: kvaL_halfPoint, selectedVoltageSource });
   const infoMessage = {
    'Total Distance (m)': totalDistance,
    'KVA * L (KVA / m)': kvaL,
    'KVA II (KVA)': kva2,
    'Supplied by Generator I (KVA)': powerSuppliedByG1,
    'Supplied by Generator II (KVA)': powerSuppliedByG2,
    'Recommended Gauges': {
     'Copper': forCopper,
     'Aluminium': forAluminium
    }
   };
   console.log(infoMessage);
   renderResultsBox({ forCopper, forAluminium });
  };
  function forRadial({ selectedVoltageSource, gauges, kvaL, totalDistance }) {
   const { forCopper, forAluminium } = getGauges({ gauges, kvaL_needed: kvaL, selectedVoltageSource });
   const infoMessage = {
    'Total Distance (m)': totalDistance,
    'KVA * L (KVA / m)': kvaL,
    'Recommended Gauges': {
     'Copper': forCopper,
     'Aluminium': forAluminium
    }
   };
   console.log(infoMessage);
   renderResultsBox({ forCopper, forAluminium });
  };
 };
 
 // UI/UX part starts here 
 function generateDistanceBoxes() {
  const template = function(idx) {
   return `
    <div class="distance-item">
     <label class="label-styling">${idx}</label>
     <input type="text" name="distance-value" class="distance-input text-box" data-distance-box=${idx}>
    </div>
   `;
  };
  return { template };
 };

 function renderDistanceBoxes({template}) {
  let fragment = '';
  let boxesToRender = parseInt(branchInputElValue, 10);
  if (ring.checked) { // Ring systems needs an extra distance field.
   for(let i = 0; i < boxesToRender + 1; i++) {
    fragment = fragment + template(i + 1);
   };
  } else { // Radial systems needs same distance fields as loads.
   for(let i = 0; i < boxesToRender; i++) {
    fragment = fragment + template(i + 1);
   };
  };
  distanceBoxesEl.innerHTML = fragment;
 };
 
 function generateBranchObjects(qty){
  const branchesObj = {};
  const template = function(idx) {
   return `
    <div class="branch-item" data-branch=${idx}>
     <div class="branch-header">
      <h3>Branch ${idx}</h3>
      <button class="btn btn-manjaro add-load" data-load-button=${idx}>
       <label class="add-load-label" data-load-button=${idx}>+</label>
      </button>
     </div>
    </div>
   `;
  };
  for(let i = 0; i < qty; i++) {
   branchesObj[`branch${i + 1}`] = Object.create({});
   branchesObj[`branch${i + 1}`]['id'] = i + 1;
   branchesObj[`branch${i + 1}`]['loads']  = 0;
   branchesObj[`branch${i + 1}`]['template'] = template(i + 1);
  };
  return { branchesObj };
 };
 
 function renderBranchBoxes({branchesObj}) {
  let fragment = '<button class="btn btn-manjaro" style="flex-basis:100%;" data-load-button="perBranch">+1 PER BRANCH</button>';
  const branchesToRender = Object.keys(branchesObj).length;
  branchSectionEl.innerHTML = null;
  
  for(let i = 0; i < branchesToRender; i++) {
   fragment = fragment + branchesObj[`branch${i + 1}`]['template'];
  };
  
  branchSectionEl.innerHTML = fragment;
 };

 function generateNewLoadBox({branchesObj}){
  const addLoadEls = document.querySelectorAll('button.add-load');
  const branchTargets = document.querySelectorAll('div.branch-item');
  const template = function(id) {
   return `
    <div class="load-wrapper" data-load=${id}>
     <input type="text" name="l${id}" id="l${id}" class="load-input text-box" placeholder="E.g 3*25">
     <label class="label-styling" for="l${id}"><b>KVA</b></label>
    </div>
   `;
  };
  const addLoadPerBranchOnClick = function(ev) {
   for (let i = 0, current, loads; i < branchTargets.length; i++) {
    current = branchesObj[`branch${i + 1}`];
    current.loads++
    renderNewLoadBox(branchTargets[i], template, current.loads)
   }
  }
  const addLoadOnClick = function(ev) {
   const dataId = ev.target.dataset.loadButton;
   const currentBranchEl = branchTargets[dataId - 1];
   const currentBranchDataId = currentBranchEl.dataset.branch;
   const branchObj = branchesObj[`branch${dataId}`];
   branchObj['loads']++;
   renderNewLoadBox(currentBranchEl, template, branchObj.loads);
  };
  function addLoadEventHandler(ev) {
   const dataId = ev.target.dataset.loadButton;
   (dataId) 
    ? (dataId !== 'perBranch')  
    ? addLoadOnClick(ev) 
    : (dataId == 'perBranch') 
    ? addLoadPerBranchOnClick(ev)
    : 0
    : 0;
  };
  window.addEventListener('click', addLoadEventHandler);
 };
 function renderNewLoadBox(target, template, loads) {
  let templateToBeInserted, filledTemplates = [];
  for(let i = 0; i < loads; i++) {
   filledTemplates.push(template(i + 1))
  };
  templateToBeInserted = filledTemplates[filledTemplates.length - 1];
  target.innerHTML += templateToBeInserted;
 };

 function renderResultsBox({ forCopper, forAluminium }) {
  const fragment = `
   <div class="panel-section results">
    <h3>Required Wire: </h3>
    <div class="gauges-box">
     <h4 class="material-styling copper-styling">
      COPPER: ${ forCopper.gauge.replace('N', '#') }
     </h4>
     <h4 class="material-styling aluminium-styling">
      ALUMINIUM: ${ forAluminium.gauge.replace('N', '#') }
     </h4>
     <p>For more information about other parameters, press F12</p>
    </div>
   </div>
  `;
  leftSectionEl.innerHTML += fragment;
 }
 // logical part starts here
 function getLoadValues() { 
  const inputs = Array.from(document.querySelectorAll('input.load-input'));
  const loads = inputs.map( input => input.value.split("*").reduce( (current, next) => current * next)).map(load => parseInt(load, 10));
  const totalLoad = loads.reduce( (current, next) => current + next);
  return { loads, totalLoad };
 };
 
 function getDistanceValues() {
  const inputs = Array.from(document.querySelectorAll('input.distance-input'));
  const distances = inputs.map( function(input) {return parseInt(input.value)} );
  const totalDistance = distances.reduce( function(current, next) {return current + next} );
  return { distances, totalDistance };
 };

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
 
 // For ring systems: kvaL_halfPoint
 // For radial systems: kvaL
 function getGauges({ gauges, kvaL_needed, selectedVoltageSource }) {
  var copper = gauges.copper;
  var aluminium = gauges.aluminium;
  var determineGauges = function(materialName, materialObj) {
   for (let gauge in materialObj) {
    for (let voltage in materialObj[gauge]) {
     if (selectedVoltageSource == voltage) {
      let vpercent = ( (kvaL_needed * Math.pow(10, -3)) * materialObj[gauge][voltage] );
      if (vpercent < 1) {
       return {
        material: materialName,
        voltage: parseInt(voltage, 10),
        factor: materialObj[gauge][voltage],
        vpercent: vpercent,
        gauge: gauge
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
 };
 
 // Handlers
 function setSystemType(element, index) {
  function systemTypeHandler(ev) {
   selectedSystemType = element.dataset.type;
  };
  element.addEventListener('change', systemTypeHandler);
 };

 function setVoltageSource(element, index) {
  function voltageSourceHandler(ev) {
   selectedVoltageSource = element.dataset.voltage;
  };
  element.addEventListener('change', voltageSourceHandler);
 };

 function grabBranchValue() {
  branchInputElValue = branchInputEl.value;
 }

 // Event Listeners 
 window.addEventListener('click', function(ev) {
  if (ev.target == addBranchesEl) { runApp() };
  if (ev.target == calculateEl) { calculate() };
 });
 branchInputEl.addEventListener('change', grabBranchValue);
 typeRadioEls.forEach(setSystemType);
 voltageRadioEls.forEach(setVoltageSource);
});
