import React, { Component } from 'react';
import {translateComponent} from "./utils";

class UploadPackView extends Component {
  constructor(props) {
    super(props);
    this.pack = props.pack;
  }

  componentDidMount() {
    this.pack.pushObserver(this);
  }

  componentWillUnmount() {
    this.pack.popObserver(this);
  }

  upload() {
    this.pack.upload(this.refs.form.file.files[0]);
  }

  render() {
    const { t } = this.props;
    return (
      <div className="jumbotron admin-jumbotron">
        <h1 className="text-center display-3">{t("navbar.title")}</h1>
        <hr />
        <h2 className="text-center">{t("upload pack.select file")}</h2>
        <form ref="form" action="" onSubmit={e => { e.preventDefault(); this.upload(); }}>
          <div className="form-group">
            <label htmlFor="token" className="sr-only">{t("upload pack.file")}</label>
            <input type="file" name="file" id="file" className="form-control" required/>
          </div>
          <input type="submit" className="btn btn-danger" value={t("upload pack.upload")} />
        </form>
      </div>
    );
  }
}

export default translateComponent(UploadPackView, "admin");
