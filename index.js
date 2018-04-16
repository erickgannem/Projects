// Programa que permite el cálculo del conductor requerido para una red de distribución de media tensión, bien sea en anillo o radial, dependiendo de la cantidad de cargas conectadas a la misma.
// Diseñado y desarrollado por Erick Gannem y Estefany Acuña, como parte de una asignación para la asignatura: Distribución I con el profesor Simón Ramirez

"use strict";

// Declarations
const confirmBranchesBtn = document.querySelector('#branch-submit');
const branchInput = document.querySelector('#branch-input');
const distanceSection = document.querySelector('#distances');
const distances = Array.prototype.slice.call(document.querySelectorAll('.distance-input'));
const branchSection = document.querySelector('#branches-wrapper');
const calculateBtn = document.querySelector('.btn-calculate');
const ring = document.querySelector('#ring');
const voltageRadio = document.querySelectorAll('.voltage-radio');
const systemRadio = document.querySelectorAll('.type-radio');
let selectedVS = null;


// Functions

// Rendering into DOM
function generateDistanceBoxes(){
	const template = (idx) => {
		return `
			<div class="distance-item">
				<label class="label-styling">${idx}</label>
				<input type="text" name="distance-value" class="distance-input text-box" id="d${idx}">
			</div>
		`;			
	};
	if(!branchInput.value){
		return;
	};
	distanceSection.innerHTML = `<h3>Distancias (m)</h3>`;
	let fragment = '';
	if(ring.checked) {
		for(let i = 0; i < Number(branchInput.value) + 1; i+=1){
			fragment += template(i + 1);
		}
	} else {
		for(let i = 0; i < branchInput.value; i+=1){
			fragment += template(i + 1);
		}			
	}

	distanceSection.innerHTML += fragment;

	generateBranchBoxes(); // 1
	generateNewLoadBox(); // 2
};

function Branch(id, loads = 0, template){
	this.id = id;
	this.loads = loads;
	this.template = template;
}
Branch.prototype.addLoad = function(){
	this.loads += 1;
}

function generateBranchBoxes(){
	const branches = [];
	const template = (idx) => {
		return `
			<div class="branch-item">
				<div class="branch-header">
					<h3>Rama ${idx}</h3>
					<button class="btn btn-manjaro add-load"><label class="add-load-label">+</label></button>
				</div>
			</div>
		`;
	};

	let fragment = '';
	branchSection.innerHTML = null;

	for(let i = 0; i < branchInput.value; i+=1){
		branches.push(new Branch(i + 1, 0, template(i + 1)))
		fragment += branches[i].template;
	}

	branchSection.innerHTML = fragment;
	return {branches};
};

function generateNewLoadBox(){
	const branches = generateBranchBoxes().branches;
	const newLoadBtn = document.querySelectorAll('.add-load');
	const template = (idx) => {
		return `
			<div class="load-wrapper">
				<label for="l${idx}" class="label-styling">L${idx}</label>
				<input type="text" name="l${idx}" id="l${idx}" class="load-input text-box" placeholder="Ej: 3*25">
			</div> 		
		`
	}
	newLoadBtn.forEach(function(btn, idx){
		const btnGp = btn.parentNode.parentNode;
		let fragment = null;
		btnGp.addEventListener('click', function(ev){
			if(ev.target.classList.contains('add-load') || ev.target.classList.contains('add-load-label')){
				branches[idx].addLoad();
				for(let i = 0; i < branches[idx].loads; i += 1){
					fragment = template(i + 1);
				}
				btnGp.innerHTML += fragment;
			}
		}, false);
	});
}

// Logical part (getting values from fields)

function loadsHandler(){
	const branchContainer = document.querySelectorAll('.branch-item');
	let loads = [];
	let totalLoad = null;
	let load = 0;


	branchContainer.forEach( function (branch, i){
		Array.prototype.slice.call(branch.children).forEach(function(loadWrapper, j) {
			if(loadWrapper.classList.contains('load-wrapper') ){

				Array.prototype.slice.call(loadWrapper.children).forEach(function(loadInput, k) {
					if(loadInput.classList.contains('load-input') ){
						load += eval(loadInput.value);
					}
				});
			}

		});
		loads.push(Number(load));
		load = 0;
	});

	totalLoad = loads.reduce(function(acc, next){
		return next + acc;
	}, 0);

	return {loads, totalLoad};
}

function distancesHandler(){
	const distanceInput = document.querySelectorAll('.distance-input');
	const distanceValues = [];

	distanceInput.forEach( input => distanceValues.push(Number(input.value)));
	const totalDistance = Array.prototype.slice.call(distanceInput).reduce(function(acc, next){
		return Number(next.value) + acc;
	}, 0);
	return {totalDistance, distanceValues};
};



function calculate(){

	// needed values to calculate
	const totalDistance = distancesHandler().totalDistance;
	const distances = distancesHandler().distanceValues;
	const loadValues = loadsHandler().loads;
	const totalLoad = loadsHandler().totalLoad;
	const forRing = ringCalc;
	// const forRadial = radialCalc;

	// Choose between Ring / Radial System
	if(ring.checked) {
		forRing(totalDistance, distances, loadValues, totalLoad);
	} else{
		radialCalc(totalDistance, distances, loadValues, totalLoad);	
	}
}

// Calculation for a ring system
function ringCalc(td, d, l, tl){
	let kvaL = kvalCalc(d, l), 
			kvaT = tl, 
			kvaII = (kvaL / td),
			kvaI = (kvaT - kvaII), 
			halfPointLoad = halfPointHandler(kvaII, l).difference,
			halfPointLoads = halfPointHandler(kvaII, l).halfPointLoads,
			kvalHalfPoint = kvalHalfPointHandler(d, halfPointLoads),
			pvCooper = getCooperGauge(kvalHalfPoint, selectedVS).pV,
			pvAluminium = getAluminiumGauge(kvalHalfPoint, selectedVS).pV,
			cooperGauge = getCooperGauge(kvalHalfPoint, selectedVS).gauge,
			aluminiumGauge = getAluminiumGauge(kvalHalfPoint, selectedVS).gauge;
	d = d.slice(0, d.length - 1);

	// For user to see more information on log
	console.log(`TIPO DE SISTEMA SELECCIONADO: ANILLO`);
	console.log(`VOLTAJE SELECCIONADO: ${selectedVS}`);
	console.log(`DISTANCIA TOTAL: ${td}`);
	console.log(`DISTANCIAS: ${d}`);
	console.log(`CARGAS: ${l}`);
	console.log(`KVA TOTAL: ${tl}`);
	console.log(`KVA * L: ${kvaL}`);
	console.log(`KVA I: ${kvaI}`);
	console.log(`KVA II: ${kvaII}`);
	console.log(`KVA EN PUNTO MEDIO: ${halfPointLoad}`);
	console.log(`KVAm: ${kvalHalfPoint}`);
	console.log(`%V Cobre: ${pvCooper}`);
	console.log(`Conductor requerido de Cobre: ${cooperGauge}`);
	console.log(`%V Aluminio: ${pvAluminium}`);
	console.log(`Conductor requerido de Aluminio: ${aluminiumGauge}`);
}

// Calculation for a radial system
function radialCalc(td, d, l, tl){
	let kvaL = kvalCalc(d, l),
	pvCooper = getCooperGauge(kvaL, selectedVS).pV,
	pvAluminium = getAluminiumGauge(kvaL, selectedVS).pV,
	cooperGauge = getCooperGauge(kvaL, selectedVS).gauge,
	aluminiumGauge = getAluminiumGauge(kvaL, selectedVS).gauge;



	// For user to see more information on log
	console.log(`TIPO DE SISTEMA SELECCIONADO: RADIAL`);
	console.log(`VOLTAJE SELECCIONADO: ${selectedVS}`);
	console.log(`DISTANCIA TOTAL: ${td}`);
	console.log(`DISTANCIAS: ${d}`);
	console.log(`CARGAS: ${l}`);
	console.log(`KVA TOTAL: ${tl}`);
	console.log(`KVA * L: ${kvaL}`);
	console.log(`%V Cobre: ${pvCooper}`);
	console.log(`Conductor requerido de Cobre: ${cooperGauge}`);
	console.log(`%V Aluminio: ${pvAluminium}`);
	console.log(`Conductor requerido de Aluminio: ${aluminiumGauge}`);	
}

// Required functions to perform calculation
function kvalCalc(d, l){
	let sum = null,
			product = null,		
			kvaM = [],
			i = 0;
	d.reduce(function(acc, next){
		product = null;
		sum = next + acc;

		while(i < l.length){
			product = l[i] * sum;
			i++;
			break;
		}
		kvaM.push(product);
		return sum;
	}, 0);
	return kvaM.reduce(function(acc, next){
		return acc + next
	});
}

function halfPointHandler(kvaII, l){
	let acc = 0;
	let halfPoint = 0;
	let halfPointLoads = [];
	let difference = 0;

	for(var i = l.length - 1; i >= 0; i--){
		let current = l[i];
		halfPointLoads.push(l[(l.length - 1) - i]);
		acc += current;

		if( kvaII - acc < 0){
			halfPoint += current
			difference = Math.abs(kvaII - acc);
			break;
		};
	};
	halfPointLoads.pop();
	halfPointLoads.push(difference);

	return {
		difference: difference, 
		halfPointLoad: halfPoint, 
		halfPointLoads 
	};
}

function kvalHalfPointHandler(d, l){
	d = d.slice(0, l.length);
	return kvalCalc.apply(this, arguments);
}

// Needs to be refactored
function getCooperGauge(kvaM, vSource){
	const gauges = ['#6', '#4', '#2', '#1', '#1/0', '#2/0', '#3/0', '#4/0'];
	const k24 = [ 2.5950e-2, 1.8120e-2, 1.3260e-2, 1.1440e-2, 0.9990e-2, 0.8830e-2, 0.7870e-2, 0.7080e-2 ];
	const k138 = [ 0.7850e-3, 0.5480e-3, 0.4010e-3, 0.3460e-3, 0.3020e-3, 0.2670e-3, 0.2380e-3, 0.2140e-3 ];
	const k345 = [0.1260e-3, 0.0870e-3, 0.0642e-3, 0.0554e-3, 0.0484e-3, 0.0428e-3, 0.0381e-3, 0.0343e-3 ];
	var voltageLvl = null;
	var pV = null;

	if(vSource == 2400) {voltageLvl = 'k24'}
	if(vSource == 13800) {voltageLvl = 'k138'}
	if(vSource == 34500) {voltageLvl = 'k345'}

	for(let i = 0; i < voltageLvl.length; i++){
		let gauge = gauges[i];
		switch(voltageLvl){
			case 'k24':
				pV = ((kvaM/1000) * k24[i]);
				break;
			case 'k138':
				pV = ((kvaM/1000) * k138[i]);
				break;
			case 'k345':
				pV = ((kvaM/1000) * k345[i]);
				break;
		}
		if(pV < 1) {
			return {
				pV, 
				gauge
			}
		} else {
			throw new Error(`No existe conductor para este sistema a este nivel de voltaje (${vSource})`)
		}
	}
}


function getAluminiumGauge(kvaM, vSource){
	const gauges = ['#4', '#2', '#1/0', '#2/0', '#3/0', '#4/0'];
	const k24 = [ 2.9230e-2, 2.0100e-2, 1.4280e-2, 1.2230e-2, 1.0580e-2, 0.9260e-2 ];
	const k138 = [ 0.8840e-3, 0.6080e-3, 0.4320e-3, 0.3700e-3, 0.3200e-3, 0.2800e-3 ];
	const k345 = [ 0.1420e-3, 0.0973e-3, 0.0682e-3, 0.0592e-3, 0.0512e-3, 0.0448e-3 ];
	var voltageLvl = null;
	var pV = null;

	if(vSource == 2400) {voltageLvl = 'k24'}
	if(vSource == 13800) {voltageLvl = 'k138'}
	if(vSource == 34500) {voltageLvl = 'k345'}

	for(let i = 0; i < voltageLvl.length; i++){
		let gauge = gauges[i];
		switch(voltageLvl){
			case 'k24':
				pV = ((kvaM/1000) * k24[i]);
				break;
			case 'k138':
				pV = ((kvaM/1000) * k138[i]);
				break;
			case 'k345':
				pV = ((kvaM/1000) * k345[i]);
				break;
		}
		if(pV < 1) {
			return {
				pV, 
				gauge
			}
		}
	}
}
// Events
confirmBranchesBtn.onclick = generateDistanceBoxes;
calculateBtn.onclick = calculate;

// can be refactored
voltageRadio.forEach(function(button, idx){
	button.addEventListener('click', function(ev) {
		selectedVS = Number(button.nextElementSibling.textContent);
	})
})