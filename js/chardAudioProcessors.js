var Chard = Chard || {};
Chard.ChardPlayer = Chard.ChardPlayer || {};

	Chard.ChardPlayer.registerParametricEQ = function() {
		var audioContext = module.audioContext;
		
		module.parametricEQ = new Chard.ParametricEQ(audioContext);
		
		//Ideally linking should be done once all the nodes are instantiated and not like this to properly use the linking of the AudioProcessor
	  module.parametricEQ.linkPrevious(module.lastNode);
		module.lastNode = module.parametricEQ.getLastNode();
		
		//Render!
		module.parametricEQ.render(jQuery('.processors'));
	};

	Chard.ChardPlayer.registerGraphicEQ = function() {
		var audioContext = module.audioContext;
		
		module.graphicEQ = new Chard.GraphicEQ(audioContext);
		
		//Ideally linking should be done once all the nodes are instantiated and not like this to properly use the linking of the AudioProcessor
	  module.graphicEQ.linkPrevious(module.lastNode);
		module.lastNode = module.graphicEQ.getLastNode();
		
		//Render!
		module.graphicEQ.render(jQuery('.processors'));
	}

Chard.AudioProcessor = function() {
	this.previousNode = null; //the AudioNode to receive input from
	this.nextNode = null; //the AudioNode to connect output to
	this.templateSelector = null; //jQuery selector to grab the HTML template
	this.templateClass = null; //class name to append the processor number to for targetting specific AudioProcessor in the DOM
	this.processorNumber = Chard.AudioProcessor.prototype.assignProcessorNumber(); //Pull a unique number 
	this.audioNodes = null; //Will be an array of nodes
};

Chard.AudioProcessor.prototype = {
  processorNumber: 0,
	assignProcessorNumber: function() {
	  var self = Chard.AudioProcessor.prototype,
	    assignNumber = self.processorNumber;
	 
	  self.processorNumber = self.processorNumber + 1;
		
		return assignNumber;
	},
	link: function(prevNode, nxtNode) {
		var lastNodeIdx = 0;
	
		this.previousNode = prevNode;
		this.nextNode = nxtNode;
		
		if(this.audioNodes && this.audioNodes.length > 0 && this.previousNode && this.nextNode) {
			lastNodeIdx = this.audioNodes.length - 1;
			this.previousNode.disconnect(0);
			this.previousNode.connect(this.audioNodes[0]);
			this.audioNodes[lastNodeIdx].disconnect(0);
			this.audioNodes[lastNodeIdx].connect(this.nextNode);
		}
	},
	linkPrevious: function(prevNode) {
		this.previousNode = prevNode;
		
		if(this.audioNodes && this.audioNodes.length > 0 && this.previousNode) {
			this.previousNode.disconnect(0);
			this.previousNode.connect(this.audioNodes[0]);
		}
	},
	linkNext: function(nxtNode) {
		var lastNodeIdx = 0;
		
		this.nextNode = nxtNode;
		
		if(this.audioNodes && this.audioNodes.length > 0 && this.nextNode) {
			lastNodeIdx = this.audioNodes.length - 1;
			this.audioNodes[lastNodeIdx].disconnect(0);
			this.nextNode.connect(this.audioNodes[lastNodeIdx]);
		}
	},
	getLastNode: function() {
		return this.audioNodes.length > 0 ? this.audioNodes[this.audioNodes.length - 1] : null;
	}, 
	render : function(parentElement) {
		var template = $(this.templateSelector),
		clonedTemplate = $(template.clone().html());
		
		clonedTemplate.addClass(this.templateClass);
		parentElement.append(clonedTemplate);
		
		this.registerListeners();
	},
	registerListeners : function() {
	  //Function stub. Override in implementations to wire the specific event listeners
	}
};

Chard.ParametricEQ = function(audioContext) {
	
	var that = new Chard.AudioProcessor();
	
	if(!audioContext) {
		return that;
	}
	
	//Instantiate the filters
	that.highPassFilter = audioContext.createBiquadFilter();
	that.lowFilter = audioContext.createBiquadFilter();
	that.midFilter = audioContext.createBiquadFilter();
	that.highFilter = audioContext.createBiquadFilter();
	that.lowPassFilter = audioContext.createBiquadFilter();
			
	//Setup the node array
	that.audioNodes = [that.highPassFilter, that.lowFilter, that.midFilter, that.highFilter, that.lowPassFilter];

	//Setup the DOM selectors
	that.templateSelector = '#parametricEQTemplate';
	that.templateClass = 'parametricEQ'+that.processorNumber;
	
	//Initialize values
	that.lowFilter.gain.value = 0.0;
	that.midFilter.gain.value = 0.0;
	that.highFilter.gain.value = 0.0;
	
	that.lowFilter.Q.value = 1.0;
	that.midFilter.Q.value = 1.0;
	that.highFilter.Q.value = 1.0;
	
	that.highPassFilter.frequency.value = 10;
	that.lowFilter.frequency.value = 512;
	that.midFilter.frequency.value = 2048;
	that.highFilter.frequency.value = 8192;
	that.lowPassFilter.frequency.value = 20000;
	
	that.highPassFilter.type = "highpass";
	that.lowFilter.type = "peaking";
	that.midFilter.type = "peaking";
	that.highFilter.type = "peaking";
	that.lowPassFilter.type = "lowpass";
	
	that.type1Options = ["lowshelf", "peaking"];
	that.type2Options = ["peaking"];
	that.type3Options = ["highshelf", "peaking"];
	
	//Link the filters
	that.highPassFilter.connect(that.lowFilter);
	that.lowFilter.connect(that.midFilter);
	that.midFilter.connect(that.highFilter);
	that.highFilter.connect(that.lowPassFilter);
	
	//Setup the event binding methods
	that.registerListeners = function() {
	  var eqNode = jQuery('.'+that.templateClass),
		parametricEq = that;
		
		eqNode.change(function(ev) {
			var target = ev.target,
			parameterType = target.dataset['parameterType'],
			nodeDataVar = target.dataset['var'],
			audioNode = parametricEq[nodeDataVar];
			
			audioNode[parameterType].value = target.value;
			
			$(target).next().html(target.value);
		});
		
	};
	
	return that;
}

Chard.ParametricEQ.prototype = Chard.AudioProcessor.prototype;

Chard.GraphicEQ = function(audioContext) {

	var that = new Chard.AudioProcessor();
	
	if(!audioContext) {
		return that;
	}

	//Instantiate the filters -- We create a parallel circuit with a pre and post gain (which also double as encapsulating the parallel circuit from outside nodes)
	//Pre-Gain is a filter because the normal GainNode is only a positive amplified, we will use a shelf across the entire frequency spectrum to attenuate/boost
	//Then separate it out into bandpass filters to contain each parallel signal path to its own unique frequency bandwidth (see: http://www.sengpielaudio.com/calculator-bandwidth.htm)
	//Then pass each bandpass in serial to a peaking filter to be able to adjust the gain of the bandpass.
	//Finally route each path back into the post gain
	that.preGain = audioContext.createGainNode();
	that.preGainAtt = audioContext.createGainNode();
	that.bandpass1 = audioContext.createBiquadFilter(); //64 hz
	that.bandpass2 = audioContext.createBiquadFilter(); //128 hz
	that.bandpass3 = audioContext.createBiquadFilter(); //256 hz
	that.bandpass4 = audioContext.createBiquadFilter(); //512 hz
	that.bandpass5 = audioContext.createBiquadFilter(); //1024 hz
	that.bandpass6 = audioContext.createBiquadFilter(); //2048 hz
	that.bandpass7 = audioContext.createBiquadFilter(); //4096 hz
	that.bandpass8 = audioContext.createBiquadFilter(); //8192 hz
	that.bandpass9 = audioContext.createBiquadFilter(); //16384 hz
	that.band1 = audioContext.createBiquadFilter(); //64 hz
	that.band2 = audioContext.createBiquadFilter(); //128 hz
	that.band3 = audioContext.createBiquadFilter(); //256 hz
	that.band4 = audioContext.createBiquadFilter(); //512 hz
	that.band5 = audioContext.createBiquadFilter(); //1024 hz
	that.band6 = audioContext.createBiquadFilter(); //2048 hz
	that.band7 = audioContext.createBiquadFilter(); //4096 hz
	that.band8 = audioContext.createBiquadFilter(); //8192 hz
	that.band9 = audioContext.createBiquadFilter(); //16384 hz
	that.postGain = audioContext.createGainNode();
			
	//Setup the node array
	that.audioNodes = [that.preGain, 
	  that.bandpass1, that.bandpass2, that.bandpass3, that.bandpass4, that.bandpass5, that.bandpass6, that.bandpass7, that.bandpass8, that.bandpass9,
	  that.band1, that.band2, that.band3, that.band4, that.band5, that.band6, that.band7, that.band8, that.band9, 
	  that.postGain];

	//Setup the DOM selectors
	that.templateSelector = '#graphicEQTemplate';
	that.templateClass = 'js-graphicEQ'+that.processorNumber;
	
	//Initialize values
	that.preGain.gain.value = 1;
	
	that.bandpass1.type = that.bandpass2.type = that.bandpass3.type = that.bandpass4.type = that.bandpass5.type = that.bandpass6.type =
	  that.bandpass7.type = that.bandpass8.type = that.bandpass9.type = 'bandpass';
	
	that.band1.type = that.band2.type = that.band3.type = that.band4.type = that.band5.type = that.band6.type = that.band7.type =
	  that.band8.type = that.band9.type = 'peaking';
	
	that.band1.gain.value = that.band2.gain.value = that.band3.gain.value = that.band4.gain.value = that.band5.gain.value 
	  = that.band6.gain.value = that.band7.gain.value = that.band8.gain.value = that.band9.gain.value = 0;
	
	//Set Qs to 1 octave bandwidths
	that.bandpass1.Q.value = that.bandpass2.Q.value = that.bandpass3.Q.value = that.bandpass4.Q.value = that.bandpass5.Q.value 
	  = that.bandpass6.Q.value = that.bandpass7.Q.value = that.bandpass8.Q.value = that.bandpass9.Q.value = 1.4142;
		
	//Set the peaking Qs as high as possible since we are already restricted to the bandwidth by the bandpass	
	that.band1.Q.value = that.band2.Q.value = that.band3.Q.value = that.band4.Q.value = that.band5.Q.value 
		= that.band6.Q.value = that.band6.Q.value = that.band7.Q.value = that.band8.Q.value = that.band9.Q.value = 0.001;

	var i = 1, 
	frequency = 64, 
	lengthWithoutGains = that.audioNodes.length - 2, 
	bands = (lengthWithoutGains) / 2;
	
	for(; i <= bands; i = i+1, frequency = frequency * 2) {
	  that.audioNodes[i].frequency.value = that.audioNodes[i+bands].frequency.value = frequency;
	}
	
	that.bypassed = false;
	that.alreadyConnected = false;
	
	//Declare helper function to wire up the eq for bypassing
	that.wireCircuit = function() {
		if(that.bypassed) {
			if(that.alreadyConnected) {
				that.preGain.disconnect();
			 
				that.band1.disconnect();
				that.band2.disconnect();
				that.band3.disconnect();
				that.band4.disconnect();
				that.band5.disconnect();
				that.band6.disconnect();
				that.band7.disconnect();
				that.band8.disconnect();
				that.band9.disconnect();
			}
			
			//Store existing gain value and then set to 0 so bypass isnt attenuated/boosted
			that.preGain.gain.oldValue = that.preGain.gain.value;
			that.preGain.gain.value = 1;
			jQuery('.'+that.templateClass+' .preGain').attr('value', 1);
			
			that.preGain.connect(that.postGain);
		} else {
		  if(that.alreadyConnected) {
		    that.preGain.disconnect();
				
				//Rehydrate old gain value
				that.preGain.gain.value = that.preGain.gain.oldValue;
				jQuery('.'+that.templateClass+' .preGain').attr('value', that.preGain.gain.value);
			}
			
			that.preGain.connect(that.bandpass1);
			that.preGain.connect(that.bandpass2);
			that.preGain.connect(that.bandpass3);
			that.preGain.connect(that.bandpass4);
			that.preGain.connect(that.bandpass5);
			that.preGain.connect(that.bandpass6);
			that.preGain.connect(that.bandpass7);
			that.preGain.connect(that.bandpass8);
			that.preGain.connect(that.bandpass9);
			
			//Only connect the middle nodes onces, we will just use the preGain routing to enable/disable
			if(!that.alreadyConnected) {
			  that.bandpass1.connect(that.band1);
				that.bandpass2.connect(that.band2);
				that.bandpass3.connect(that.band3);
				that.bandpass4.connect(that.band4);
				that.bandpass5.connect(that.band5);
				that.bandpass6.connect(that.band6);
				that.bandpass7.connect(that.band7);
				that.bandpass8.connect(that.band8);
				that.bandpass9.connect(that.band9);
			}
			
			that.band1.connect(that.postGain);
			that.band2.connect(that.postGain);
			that.band3.connect(that.postGain);
			that.band4.connect(that.postGain);
			that.band5.connect(that.postGain);
			that.band6.connect(that.postGain);
			that.band7.connect(that.postGain);
			that.band8.connect(that.postGain);
			that.band9.connect(that.postGain);
		}
		
		that.alreadyConnected = true;
	}
	
	//Link the filters
	that.wireCircuit();
	
	that.registerListeners = function() {
	  var eqNode = jQuery('.'+that.templateClass),
		bypass = jQuery('.'+that.templateClass+' .js-graphic-eq-bypass'),
		graphicEq = that;
		
		eqNode.change(function(ev) {
		  var target = ev.target,
			nodeDataVar = target.dataset['var'];
			
		  if(nodeDataVar == 'preGain') {
			  if(!graphicEq.bypassed) {
					graphicEq[nodeDataVar].gain.value = target.value;
				}
			} else {
				graphicEq[nodeDataVar].gain.value = target.value;
			}
		});
		
		bypass.click(function() {
			graphicEq.bypassed = !graphicEq.bypassed;
			
			if(that.bypassed) {
			  this.value = 'Enable';
			} else {
			  this.value = 'Bypass';
			}
			
			graphicEq.wireCircuit();
		});
	}
	
  return that;
}

Chard.GraphicEQ.prototype = Chard.AudioProcessor.prototype;