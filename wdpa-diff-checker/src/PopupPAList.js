import React from 'react';

class PopupPAList extends React.Component {
	render() {
		let left = this.props.xy.x + 25 + 'px';
		let top = this.props.xy.y - 25 + 'px';
		let children = this.props.features.map((item)=>{
			return <div className={'wdpaPopup'} key={item.wdpaid}><a href={"https://www.protectedplanet.net/" + item.wdpaid} target='_blank'  rel="noopener noreferrer" title='Click to open the protected area in the Protected Planet website'>{item.name}<span style={{paddingRight:'5px'}}/>({item.iucn_cat})</a></div>;
		});
		return (
			<div style={{'display': children && children.length > 0 ? 'block' : 'none', 'left': left,'top':top}} id="popup" onMouseOver={this.props.onMouseEnter} onMouseLeave={this.props.onMouseLeave}>
				{children}
			</div>
		);
	}
}

export default PopupPAList;