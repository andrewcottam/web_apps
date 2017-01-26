define(["dojo/_base/array", "dojo/_base/declare", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojo/text!./templates/ReferenceBox.html"], 
	function(array, declare, _WidgetBase, _TemplatedMixin, template) {
	return declare([_WidgetBase, _TemplatedMixin], {
		templateString : template,
		postMixInProperties : function() {
			this.publicationImageurl = "https://api.elsevier.com/content/serial/title/issn/" + this.reference["prism:issn"] + "?view=coverimage&httpAccept=image/gif&apiKey=b3a71de2bde04544495881ed9d2f9c5b";
			this.publicationName = this.reference["prism:publicationName"];
			this.title = this.reference["dc:title"];
			var authorHTML = " ";
			if (this.reference.authors){
				array.forEach(this.reference.authors.author, function(author) {
					authorHTML = authorHTML + author.surname + ", " + author["given-name"].slice(0,1) + "., ";
				});
			}else{
				authorHTML = "No authors given,,";
			};
			authorHTML = authorHTML.slice(0,-2);
			this.authors = authorHTML;
			this.viewOnlineUrl = "https://www.sciencedirect.com/science/article/pii/" + this.reference.pii;
			this.date = this.reference["prism:coverDisplayDate"];
			if (this.reference["prism:teaser"]){
				this.teaser = "Abstract: " + this.reference["prism:teaser"];
			}else{
				this.teaser = "";
			}
		},
	});
});
