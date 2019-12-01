function TimeProfiler() {
	this.timestamps = [];
	this.names = [];
	this.timespans = [];
	this.timestamps[0] = performance.now();
	this.names[0] = "init";
	this.timespans[0] = 0;
}

TimeProfiler.prototype = {
    
    constructor: TimeProfiler,
    
    add: function(name) {
    	var ts = performance.now();
    	var diff = ts - this.timestamps[this.timestamps.length-1];
    	this.timestamps.push(ts);
    	this.names.push(name);
    	this.timespans.push(diff);
    	return diff;
    },
    
    print: function() {
    	var str = "";
    	for (var i=0; i<this.timestamps.length; i++) {
    		str += this.names[i] + " : " + this.timespans[i].toFixed(2) + " ms\n";
    	}
    	str += "total: " + (this.timestamps[this.timestamps.length-1] - this.timestamps[0]).toFixed(2) + " ms";
    	console.log(str);
    }
    
};