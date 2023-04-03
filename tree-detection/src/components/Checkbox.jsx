import React from 'react';

class Checkbox extends React.Component {
    render() {
        return (
            <div className={'checkbox_container'}>
                <input className={'checkbox'} id={this.props.id} type="checkbox" checked={this.props.checked} onChange={this.props.onChange.bind(this)} disabled={this.props.disabled}/>
                <label for={this.props.id} className={'checkbox_label'}>{this.props.label}</label>
            </div>
        );
    }
}

export default Checkbox;