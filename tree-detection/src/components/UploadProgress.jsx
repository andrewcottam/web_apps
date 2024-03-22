import React from "react";
// material-ui components
import Button from '@mui/material/Button';

class UploadProgress extends React.Component {
  pause(e) {
    this.props.pause();
  }

  resume(e) {
    this.props.resume();
  }

  cancel(){
    this.props.cancel();
  }
  render() {
    return (
      <div className={"dialog"} style={{ display: this.props.open ? "block" : "none" }}>
        <div className={"subDialog"}>
          <div>Uploading..</div>
          <progress value={this.props.upload_progress} max={100} />
          <div style={{margin:'20px', display: 'flex',  columnGap: '20px', justifyContent: 'space-between'}}>
            <Button size="small" variant="contained" title='Cancel the upload' onClick={this.cancel.bind(this)}>Cancel</Button>
            <Button size="small" variant="contained" title='Resume the upload' disabled={this.props.uploading} onClick={this.resume.bind(this)}>Resume</Button>
            <Button size="small" variant="contained" title='Pause the upload' disabled={!this.props.uploading} onClick={this.pause.bind(this)}>Pause</Button>
          </div>
        </div>
      </div>
    );
  }
}

export default UploadProgress;
