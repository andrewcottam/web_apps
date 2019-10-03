import React from "react";
import Paper from '@material-ui/core/Paper';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';

class InfoPanel extends React.Component {
    constructor(props) {
        super(props);
        this.state = ({ wdpa_version: "" });
    }

    handleChange(event, child) {
        this.setState({ wdpa_version: event.target.value });
        this.props.changeBaseYear(child.props.item);
    }

    render() {
        let c = this.props.wdpa_versions.map(item => {
            return (
                <MenuItem value={item.value} key={item.value} item={item}>{item.alias}</MenuItem>
            );
        });
        return (
            <Paper className={'infoPanel'}>
                <div>Select the base and comparison versions</div>
                <Select onChange={this.handleChange.bind(this)} children={c} value={this.state.wdpa_version}/>
        </Paper>
        );
    }
}

export default InfoPanel;
