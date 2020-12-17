$(document).ready(function () {
	window.addEventListener("resize", resetPuzzle);

	let puzzleBoard = document.getElementById('puzzle-board');
	let magnetDistance = 25;

	let fieldsData = {
		'type-1': [
			{x: 0.293572, y: 0.346925, rotation: 292, number: 6},
			{x: 0.354687, y: 0.208514, rotation: 325, number: 5},
			{x: 0.464913, y: 0.150993, rotation: 0, number: 4},
			{x: 0.576230, y: 0.210312, rotation: 36, number: 3},
			{x: 0.638437, y: 0.346925, rotation: 67, number: 2}
		],
		'type-2': [	
			{x: 0.637346, y: 0.557236, rotation: 293, number: 8},
			{x: 0.578413, y: 0.697444, rotation: 324, number: 9},
			{x: 0.467096, y: 0.753168, rotation: 0, number: 10},
			{x: 0.355779, y: 0.695647, rotation: 34, number: 11},
			{x: 0.294663, y: 0.555439, rotation: 68, number: 12}
		],
		'type-4': [	
			{x: 0.472553, y: 0.458372, rotation: 297, number: 15},
			{x: 0.391793, y: 0.461967, rotation: 53, number: 13},
		],
		'type-3': [	
			{x: 0.426716, y: 0.350520, rotation: 0, number: 14},
		],
		'type-8': [	
			{x: 0.072029, y: 0.381078, rotation: 0, number: 19},
		],
		'type-9': [	
			{x: 0.781403, y: 0.388268, rotation: 0, number: 21},
		]
	};

	let fieldsFill = {
		2: null,
		3: null,
		4: null,
		5: null,
		6: null,
		8: null,
		9: null,
		10: null,
		11: null,
		12: null,
		15: null,
		13: null,
		14: null,
		19: null,
		21: null,
	};

	createPlaceholders();
	function createPlaceholders() {
		for (let fieldType in fieldsData) {
			for (var i = 0; i < fieldsData[fieldType].length; i++) {
				let field = document.createElement('img');
				
				field.className = 'placeholder';
				field.style.left = `calc(${100*fieldsData[fieldType][i].x}%)`;
				field.style.top = `calc(${100*fieldsData[fieldType][i].y}%)`;
				field.style.transform = `rotate(${fieldsData[fieldType][i].rotation}deg)`;
				field.src = `./images/${fieldsData[fieldType][i].number}.png`;
				field.id = 'puzzle-placeholder-'+fieldsData[fieldType][i].number;

				puzzleBoard.appendChild(field);
			}
		}
	}

	function resetPuzzle() {
		//Hide alert complete
		$('#alert-complete').hide();
		$('#alert-complete > h2').removeClass('animated tada');

		//Hide alert error
		$('#alert-error').hide();

		//Reset fieldsFill
		for(let number in fieldsFill){
			fieldsFill[number] = null; 
		}

		let puzzleBoard = document.querySelector('#puzzle-board img');

		let factor = puzzleBoard.clientWidth / puzzleBoard.naturalWidth;

		let allPieces = document.querySelectorAll('[role="puzzle-piece"], .placeholder');

		let draggablePieces = document.querySelectorAll('[role="puzzle-piece"]');

		for (let i = 0; i < allPieces.length; i++) {
			allPieces[i].style.width = allPieces[i].naturalWidth * factor + 'px';
			allPieces[i].style.height = allPieces[i].naturalHeight * factor + 'px';
		}

		for (let i = 0; i < draggablePieces.length; i++) {
			draggablePieces[i].setAttribute('data-x', 0);
			draggablePieces[i].setAttribute('data-y', 0);
			draggablePieces[i].setAttribute('rotation', 0);
			setRotationAndTranslation(draggablePieces[i]);
		}

		startInteraction()
	}

	function startInteraction() {
		interact('[role="puzzle-piece"]').unset();

		interact('[role="puzzle-piece"]').draggable({
			// enable inertial throwing
			inertia: true,
			// keep the element within the area of it's parent
			modifiers: [
				interact.modifiers.restrict({
					//restriction: "parent",
					restriction: function(x, y, element) {
						let restrictor = getRestrictElement(element.element);
						
						if (restrictor.id != 'puzzle-box') checkStatus();

						return restrictor;
					},
					endOnly: true,
					elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
				}),
			],
			// enable autoScroll
			autoScroll: true,
			// call this function on every dragmove event
			onmove: dragMoveListener,
		});

		interact('[role="puzzle-piece"]').on('tap', function (event) {
			event.preventDefault();

			//Set current target
			let target = event.currentTarget;

		    //Set new rotation degrees
			target.setAttribute('rotation', getNextRotation(event));
			//target.setAttribute('rotation', parseInt(target.getAttribute('rotation') || 0) + (event.button === 2 ? -5 : 5));

		    //Get actual rotation degrees
			let rotation = target.getAttribute('rotation');

			//Update element style
			setRotationAndTranslation(target);
		});
	}

	function checkStatus() {
		for(let number in fieldsFill){
			if (fieldsFill[number] != number) return checkError(); 
		}

		//Hide alert error
		$('#alert-error').hide();

		//Show alert complete
		$('#alert-complete').slideDown();

		//Scroll to alert
		$('html,body').animate({
			scrollTop: $('#alert-complete').offset().top - 30
		}, 'slow', function() {
			//Animate alert title
			$('#alert-complete > h2').addClass('animated tada');
		});

		return true;
	}

	function checkError() {
		for(let number in fieldsFill){
			if (fieldsFill[number] === null) return false; 
		}
		
		//Hide alert complete
		$('#alert-complete').hide();

		//Show alert error
		$('#alert-error').slideDown();

		//Scroll to alert error
		$('html,body').animate({
			scrollTop: $('#alert-error').offset().top - 30
		}, 'slow');

		return true;
	}
	
	function getRestrictElement(piece) {
		let pieceType = piece.getAttribute('piece-type');

		let fields = fieldsData['type-'+pieceType];
		
		if (fields) {
			let actual = {
				x: piece.getAttribute('data-x'), 
				y: piece.getAttribute('data-y'), 
				rotation: piece.getAttribute('rotation'),
				number: piece.getAttribute('piece-number')
			};

			//Remove from fieldsFill
			for (let number in fieldsFill) {
				if (fieldsFill[number] == actual.number) fieldsFill[number] = null;
			}

			for (let i = 0; i < fields.length; i++) {
				let field = {
					x: fields[i].x * puzzleBoard.clientWidth + puzzleBoard.offsetLeft - piece.offsetLeft, 
					y: fields[i].y * puzzleBoard.clientHeight + puzzleBoard.offsetTop - piece.offsetTop 
				};

				field.left 	= field.x - magnetDistance;
				field.right = field.x + magnetDistance;
				field.top 	= field.y - magnetDistance;
				field.bottom = field.y + magnetDistance;

				if (actual.x > field.left && actual.x < field.right &&
					actual.y > field.top && actual.y < field.bottom &&
					fields[i].rotation == actual.rotation &&
					fieldsFill[fields[i].number] === null
					) {
					//Add to fieldsFill 
					fieldsFill[fields[i].number] = actual.number;
					return document.getElementById('puzzle-placeholder-'+fields[i].number);
				}
			}
		}

		return document.getElementById('puzzle-box');
	}
	
	function dragMoveListener(event) {
		var target = event.target,
				// keep the dragged position in the data-x/data-y attributes
				x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
				y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

		// update the posiion attributes
		target.setAttribute('data-x', x);
		target.setAttribute('data-y', y);

		//Update element style
		setRotationAndTranslation(target);
	}

	function setRotationAndTranslation(target) {
		let x = target.getAttribute('data-x') || 0,
			y = target.getAttribute('data-y') || 0,
			rotation = target.getAttribute('rotation') || 0;

		// Set rotation and translation
		target.style.webkitTransform =
		target.style.transform =
			'translate(' + x + 'px, ' + y + 'px) '+
			'rotate(' + rotation + 'deg)';
	}

	function getNextRotation(event) {
		let target = event.target;

		let	pieceType = target.getAttribute('piece-type'),
			actualRotation = parseInt(target.getAttribute('rotation') || 0),
			reverse = event.button === 2,
			degrees = [0];

		if (pieceType == 1) {
			degrees = [0, 36, 67, 112, 144, 180, 215, 248, 292, 325];
		}
		else if (pieceType == 2) {
			degrees = [0, 34, 68, 112, 144, 180, 215, 248, 293, 324];
		}
		else if (pieceType == 3) {
			degrees = [0, 110, 180, 235];
		}
		else if (pieceType == 4 || pieceType == 5 || pieceType == 6 || pieceType == 7) {
			degrees = [0, 53, 180, 297];
		}
		else if (pieceType == 8 || pieceType == 9) {
			degrees = [0, 90, 180, 270];
		}

		return getNextRotationDegrees(degrees, actualRotation, reverse);
	}

	function getNextRotationDegrees(degrees, actualRotation, reverse) {
		let nextRotation = reverse ? degrees[degrees.length-1] : degrees[0];

		let actualRotationIndex = degrees.indexOf(actualRotation);

		if (reverse && actualRotationIndex !== 0) {
			nextRotation = degrees[actualRotationIndex-1];
		}
		else if (!reverse && actualRotationIndex+1 !== degrees.length) {
			nextRotation = degrees[actualRotationIndex+1];
		}

		return nextRotation;
	}

	function showByHash(hash) {
		let id = hash.substring(1);
		$('[tab]').hide();
		$('[tab-id='+id).show();

		if (id === 'puzzle') resetPuzzle();
	}

	showByHash(location.hash || $('[tab-button]')[0].hash);

	$('[tab-button]').click(function(event) {
		showByHash(this.hash);
	});

	$('#reset').click(()=>{
		$('html,body').animate({
			scrollTop: $('#puzzle-box').offset().top - 30
		}, 'slow');

		resetPuzzle();
	});
});
