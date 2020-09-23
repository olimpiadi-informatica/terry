import * as React from "react";
import Pack from "./Pack";
import { Trans, t } from "@lingui/macro";
import { i18n } from "./i18n";

type Props = {
  pack: Pack;
};

export default class UploadPackView extends React.Component<Props> {
  inputRef: React.RefObject<HTMLInputElement>;

  constructor(props: Props) {
    super(props);
    this.inputRef = React.createRef();
  }

  componentDidMount() {
    this.props.pack.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.pack.popObserver(this);
  }

  upload() {
    this.props.pack.upload(this.inputRef.current!.files![0]);
  }

  render() {
    return (
      <div className="jumbotron admin-jumbotron">
        <h1 className="text-center display-3">
          <Trans>Admin</Trans>
        </h1>
        <hr />
        <h2 className="text-center">
          <Trans>Please select the contest file...</Trans>
        </h2>
        <form
          action=""
          onSubmit={(e) => {
            e.preventDefault();
            this.upload();
          }}
        >
          <div className="form-group">
            <label htmlFor="file" className="sr-only">
              <Trans>File</Trans>
            </label>
            <input
              type="file"
              accept=".enc"
              name="file"
              id="file"
              ref={this.inputRef}
              className="form-control"
              required
            />
          </div>
          <input type="submit" className="btn btn-danger" value={i18n._(t`Upload`)} />
        </form>
      </div>
    );
  }
}
