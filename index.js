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
 let selectedVoltageSource = null;
 let selectedSystemType = null; 
 let branchInputElValue = null;
 let running = false; 
 
 // Functions
 //
 function runApp() {
  const branchesQty = branchInputEl.value;
  const branchesObj = generateBranchObjects(branchesQty);
  const infoMessage = `Running app with: ${"\n"} System Type: ${selectedSystemType} ${"\n"} Voltage Level: ${selectedVoltageSource} Volts ${"\n"} Branches: ${branchInputElValue}`; 

  if (running) { alert('Por favor, recarga la página para volver a iniciar la aplicación'); return };
  if (!selectedVoltageSource && !selectedSystemType) { alert('Por favor, selecciona voltage de entrada y tipo de sistema de distribución'); return; };
  if (!selectedVoltageSource) { alert('Por favor, selecciona voltaje de entrada'); return; };
  if (!selectedSystemType) { alert('Por favor, selecciona tipo de sistema de distribución'); return; };
  if (!branchInputElValue) { alert('Por favor, ingresa un número de ramas');  return; };

  renderDistanceBoxes(generateDistanceBoxes());
  renderBranchBoxes(branchesObj);
  generateNewLoadBox(branchesObj);

  running = true;
  console.log(infoMessage);
 };
 
 function calculate() {
  if (!running) return;
  const { distances, totalDistance } = getDistanceValues();
  const { loads } = getLoadValues();
  const { kvaL } = getKvaL({loads, distances});
  const { kva2 } = getKva2({kvaL, totalDistance});
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
      <h3>Rama ${idx}</h3>
      <button class="btn btn-manjaro add-load" data-load-button=${idx}>
       <label class="add-load-label" data-load-button=${idx}>+</label>
      </button>
     </div>
    </div>
   `;
  };
  for(let i = 0; i < qty; i++) {
   branchesObj[`branch${i + 1}`] = {};
   branchesObj[`branch${i + 1}`]['id'] = i + 1;
   branchesObj[`branch${i + 1}`]['loads']  = 0;
   branchesObj[`branch${i + 1}`]['template'] = template(i + 1);
  };
  return { branchesObj };
 };
 
 function renderBranchBoxes({branchesObj}) {
  let fragment = '';
  branchSectionEl.innerHTML = null;
  const branchesToRender = Object.keys(branchesObj).length;
  
  for(let i = 0; i < branchesToRender; i++) {
   fragment = fragment + branchesObj[`branch${i + 1}`]['template'];
  };
  
  branchSectionEl.innerHTML = fragment;
 };
 
 function generateNewLoadBox({branchesObj}){
  const addLoadEls = document.querySelectorAll('button.add-load');
  const template = function(id) {
   return `
    <div class="load-wrapper" data-load=${id}>
     <label class="label-styling" for="l${id}">LOAD</label>
     <input type="text" name="l${id}" id="l${id}" class="load-input text-box" placeholder="Ej: 3*25">
    </div>
   `;
  };
  const addLoadOnClick = function(ev) {
   const dataId = ev.target.dataset.loadButton;
   if(!dataId) return; 
   const branchTargets = document.querySelectorAll('div.branch-item');
   const currentBranchEl = branchTargets[dataId - 1];
   const currentBranchDataId = currentBranchEl.dataset.branch;
   const branchObj = branchesObj[`branch${dataId}`];
   branchObj['loads']++;
   renderNewLoadBox(currentBranchEl, template, branchObj.loads);
  };
  window.addEventListener('click', addLoadOnClick);
 };
 function renderNewLoadBox(target, template, loads) {
  let templateToBeInserted, filledTemplates = [];
  for(let i = 0; i < loads; i++) {
   filledTemplates.push(template(i + 1))
  };
  templateToBeInserted = filledTemplates[filledTemplates.length - 1];
  target.innerHTML += templateToBeInserted;
 };

 // logical part starts here
 function getLoadValues() { // This function must be called when pressing calculate button
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
  return { kvaL };
 };
 function getKva2({kvaL, totalDistance}) {
  const kva2 = (kvaL / totalDistance);
  return { kva2 };
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
//function renderResultsBox(cooperGauge, aluminiumGauge){
//  const target = document.querySelector('.left-panel');
//  const fragment = new DocumentFragment();
//
//  const resultsWrapper = document.createElement('div');
//  const resultsHeader = document.createElement('h3');
//  const resultsHeaderText = document.createTextNode('Conductor Requerido: ');
//  const gaugesWrapper = document.createElement('div');
//  const cooperHeader = document.createElement('h4');
//  const cooperHeaderText = document.createTextNode(`Cobre: ${cooperGauge} `);
//  const aluminiumHeader = document.createElement('h4');
//  const aluminiumHeaderText = document.createTextNode(`Aluminio: ${aluminiumGauge}`);
//  const moreInfo = document.createElement('p');
//  const moreInfoText = document.createTextNode('Para más información respecto a los cálculos realizados, presione F12 y vaya a la pestaña "Cónsola".');
//
//    resultsHeader.appendChild(resultsHeaderText);
//    cooperHeader.appendChild(cooperHeaderText);
//    aluminiumHeader.appendChild(aluminiumHeaderText);
//    moreInfo.appendChild(moreInfoText);
//
//    gaugesWrapper.appendChild(cooperHeader);
//    gaugesWrapper.appendChild(aluminiumHeader);
//
//    resultsWrapper.appendChild(resultsHeader);
//    resultsWrapper.appendChild(gaugesWrapper);
//    resultsWrapper.appendChild(moreInfo);
//
//    resultsWrapper.classList.add("panel-section");
//    resultsWrapper.classList.add("results");
//    gaugesWrapper.classList.add("gauges-box");
//    moreInfo.classList.add("more-info");
//    cooperHeader.classList.add('material-styling');
//    aluminiumHeader.classList.add('material-styling');
//    cooperHeader.classList.add('cooper-styling');
//    aluminiumHeader.classList.add('aluminium-styling');
//
//    fragment.appendChild(resultsWrapper);
//
//    target.appendChild(fragment);
//}
//
//function calculate(){
//
//	// needed values to calculate
//	const totalDistance = distancesHandler().totalDistance;
//	const distances = distancesHandler().distanceValues;
//	const loadValues = loadsHandler().loads;
//	const totalLoad = loadsHandler().totalLoad;
//	const forRing = ringCalc;
//	const forRadial = radialCalc;
//
//	// Choose between Ring / Radial System
//	if(ring.checked) {
//		forRing(totalDistance, distances, loadValues, totalLoad);
//	} else{
//		forRadial(totalDistance, distances, loadValues, totalLoad);
//	}
//}
//
//// Calculation for a ring system
//function ringCalc(td, d, l, tl){
//	let kvaL = kvalCalc(d, l), 
//			kvaT = tl, 
//			kvaII = (kvaL / td),
//			kvaI = (kvaT - kvaII), 
//			halfPointLoad = halfPointHandler(kvaII, l).difference,
//			halfPointLoads = halfPointHandler(kvaII, l).halfPointLoads,
//			kvalHalfPoint = kvalHalfPointHandler(d, halfPointLoads),
//			pvCooper = getCooperGauge(kvalHalfPoint, selectedVS).pV,
//			pvAluminium = getAluminiumGauge(kvalHalfPoint, selectedVS).pV,
//			cooperGauge = getCooperGauge(kvalHalfPoint, selectedVS).gauge,
//			aluminiumGauge = getAluminiumGauge(kvalHalfPoint, selectedVS).gauge;
//	d = d.slice(0, d.length - 1);
//
//	// For user to see more information on log
//	console.log(`TIPO DE SISTEMA SELECCIONADO: ANILLO`);
//	console.log(`VOLTAJE SELECCIONADO: ${selectedVS}`);
//	console.log(`DISTANCIA TOTAL: ${td}`);
//	console.log(`DISTANCIAS: ${d}`);
//	console.log(`CARGAS: ${l}`);
//	console.log(`KVA TOTAL: ${tl}`);
//	console.log(`KVA * L: ${kvaL}`);
//	console.log(`KVA I: ${kvaI}`);
//	console.log(`KVA II: ${kvaII}`);
//	console.log(`KVA EN PUNTO MEDIO: ${halfPointLoad}`);
//	console.log(`KVAm: ${kvalHalfPoint}`);
//	console.log(`%V Cobre: ${pvCooper}`);
//	console.log(`Conductor requerido de Cobre: ${cooperGauge}`);
//	console.log(`%V Aluminio: ${pvAluminium}`);
//	console.log(`Conductor requerido de Aluminio: ${aluminiumGauge}`);
//
//	renderResultsBox(cooperGauge, aluminiumGauge);
//	return { kvaL, kvaT,  kvaII, kvaI, halfPointLoad, halfPointLoads, kvalHalfPoint, pvCooper, pvAluminium, cooperGauge, aluminiumGauge }
//}
//
//// Calculation for a radial system
//function radialCalc(td, d, l, tl){
//	let kvaL = kvalCalc(d, l),
//	pvCooper = getCooperGauge(kvaL, selectedVS).pV,
//	pvAluminium = getAluminiumGauge(kvaL, selectedVS).pV,
//	cooperGauge = getCooperGauge(kvaL, selectedVS).gauge,
//	aluminiumGauge = getAluminiumGauge(kvaL, selectedVS).gauge;
//
//
//
//	// For user to see more information on log
//	console.log(`TIPO DE SISTEMA SELECCIONADO: RADIAL`);
//	console.log(`VOLTAJE SELECCIONADO: ${selectedVS}`);
//	console.log(`DISTANCIA TOTAL: ${td}`);
//	console.log(`DISTANCIAS: ${d}`);
//	console.log(`CARGAS: ${l}`);
//	console.log(`KVA TOTAL: ${tl}`);
//	console.log(`KVA * L: ${kvaL}`);
//	console.log(`%V Cobre: ${pvCooper}`);
//	console.log(`Conductor requerido de Cobre: ${cooperGauge}`);
//	console.log(`%V Aluminio: ${pvAluminium}`);
//	console.log(`Conductor requerido de Aluminio: ${aluminiumGauge}`);
//
//    renderResultsBox(cooperGauge, aluminiumGauge);
//	return { kvaL, pvCooper, pvAluminium, cooperGauge, aluminiumGauge }
//}
//
//// Required functions to perform calculation
//function kvalCalc(d, l){
//	let sum = null,
//			product = null,		
//			kvaM = [],
//			i = 0;
//	d.reduce(function(acc, next){
//		product = null;
//		sum = next + acc;
//
//		while(i < l.length){
//			product = l[i] * sum;
//			i++;
//			break;
//		}
//		kvaM.push(product);
//		return sum;
//	}, 0);
//	return kvaM.reduce(function(acc, next){
//		return acc + next
//	});
//}
//
//function halfPointHandler(kvaII, l){
//	let acc = 0;
//	let halfPoint = 0;
//	let difference = 0;
//	let halfPointLoads = new Array(...l);
//
//	for(var i = halfPointLoads.length - 1; i >= 0; i--){
//		let current;
//		 current = halfPointLoads[i];
//
//		acc += current;
//
//		if( kvaII - acc < 0){
//			halfPoint = halfPointLoads[i]
//			difference = Math.abs(kvaII - acc);
//			halfPointLoads.splice(i);
//			halfPointLoads.push(difference);
//			break;
//		};
//	};
//	return {
//		difference: difference, 
//		halfPointLoad: halfPoint, 
//		halfPointLoads 
//	};
//}
//
//function kvalHalfPointHandler(d, l){
//	d = d.slice(0, l.length);
//	return kvalCalc.apply(this, arguments);
//}
//
//// Needs to be refactored
//function getCooperGauge(kvaM, vSource){
//	const gauges = ['#6', '#4', '#2', '#1', '#1/0', '#2/0', '#3/0', '#4/0'];
//	const k24 = [ 2.5950e-2, 1.8120e-2, 1.3260e-2, 1.1440e-2, 0.9990e-2, 0.8830e-2, 0.7870e-2, 0.7080e-2 ];
//	const k138 = [ 0.7850e-3, 0.5480e-3, 0.4010e-3, 0.3460e-3, 0.3020e-3, 0.2670e-3, 0.2380e-3, 0.2140e-3 ];
//	const k345 = [0.1260e-3, 0.0870e-3, 0.0642e-3, 0.0554e-3, 0.0484e-3, 0.0428e-3, 0.0381e-3, 0.0343e-3 ];
//	var voltageLvl = null;
//	var pV = null;
//
//	if(vSource === 2400) {voltageLvl = 'k24'}
//	if(vSource === 13800) {voltageLvl = 'k138'}
//	if(vSource === 34500) {voltageLvl = 'k345'}
//
//	for(let i = 0; i < voltageLvl.length; i++){
//		let gauge = gauges[i];
//		switch(voltageLvl){
//			case 'k24':
//				pV = ((kvaM/1000) * k24[i]);
//				break;
//			case 'k138':
//				pV = ((kvaM/1000) * k138[i]);
//				break;
//			case 'k345':
//				pV = ((kvaM/1000) * k345[i]);
//				break;
//		}
//		if(pV < 1) {
//			return {
//				pV, 
//				gauge
//			}
//		}
//	}
//}
//
//
//function getAluminiumGauge(kvaM, vSource){
//	const gauges = ['#4', '#2', '#1/0', '#2/0', '#3/0', '#4/0'];
//	const k24 = [ 2.9230e-2, 2.0100e-2, 1.4280e-2, 1.2230e-2, 1.0580e-2, 0.9260e-2 ];
//	const k138 = [ 0.8840e-3, 0.6080e-3, 0.4320e-3, 0.3700e-3, 0.3200e-3, 0.2800e-3 ];
//	const k345 = [ 0.1420e-3, 0.0973e-3, 0.0682e-3, 0.0592e-3, 0.0512e-3, 0.0448e-3 ];
//	let voltageLvl = null;
//	let pV = null;
//
//	if(vSource === 2400) {voltageLvl = 'k24'}
//	if(vSource === 13800) {voltageLvl = 'k138'}
//	if(vSource === 34500) {voltageLvl = 'k345'}
//
//	for(let i = 0; i < voltageLvl.length; i++){
//		let gauge = gauges[i];
//		switch(voltageLvl){
//			case 'k24':
//				pV = ((kvaM/1000) * k24[i]);
//				break;
//			case 'k138':
//				pV = ((kvaM/1000) * k138[i]);
//				break;
//			case 'k345':
//				pV = ((kvaM/1000) * k345[i]);
//				break;
//		}
//		if(pV < 1) {
//			return {
//				pV, 
//				gauge
//			}
//		}
//	}
//}
//// Events
//confirmBranchesBtn.onclick = generateDistanceBoxes;
//calculateBtn.onclick = calculate;
//
//// can be refactored
//voltageRadio.forEach(function(button){
//	button.addEventListener('click', function() {
//		selectedVS = Number(button.nextElementSibling.textContent);
//	})
//});
