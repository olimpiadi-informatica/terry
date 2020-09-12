import * as React from "react";
import { WithTranslation } from "react-i18next";
import Pack from "./Pack";

type Props = {
  pack: Pack;
} & WithTranslation;

export default class UploadPackView extends React.Component<Props> {
  componentDidMount() {
    this.props.pack.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.pack.popObserver(this);
  }

  upload() {
    this.props.pack.upload((this.refs.form as any).file.files[0]);
  }

  render() {
    const { t } = this.props;

    return (
      <div className="jumbotron admin-jumbotron">
        <h1 className="text-center display-3">{t("navbar.title")}</h1>
        <hr />
        <h2 className="text-center">{t("upload pack.select file")}</h2>
        <form
          ref="form"
          action=""
          onSubmit={(e) => {
            e.preventDefault();
            this.upload();
          }}
        >
          <div className="form-group">
            <label htmlFor="file" className="sr-only">
              {t("upload pack.file")}
            </label>
            <input type="file" accept=".enc" name="file" id="file" className="form-control" required />
          </div>
          <input type="submit" className="btn btn-danger" value={t("upload pack.upload")!} />
        </form>
      </div>
    );
  }
}
