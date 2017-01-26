cdn
===

Ccontent Delivery Network repo to deliver my custom Javascript files
To use:

require({
	async : true,
	packages : [{
		name : "jrc",
		location : "//andrewcottam.github.io/cdn/scripts/"
	}]
}, ["jrc/wmsFilterLayer",..],function(wmsFilterLayer,..){
