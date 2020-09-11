import * as React from 'react';
import { WithTranslation } from 'react-i18next';
import { Model } from './user.models';
import PromiseView from './PromiseView';

type Props = {
  model: Model
} & WithTranslation

export default class LoginView extends React.Component<Props> {
  componentDidMount() {
    this.props.model.pushObserver(this);
  }

  componentWillUnmount() {
    this.props.model.popObserver(this);
  }

  login() {
    this.props.model.login((this.refs.form as any).token.value);
  }

  render() {
    const { t } = this.props;
    return (
      <div className="jumbotron">
        <h1 className={"text-center"}>{t("login.please login")}</h1>
        <form ref="form" action="" onSubmit={e => { e.preventDefault(); this.login(); }}>
          <div className="form-group">
            <label htmlFor="token" className="sr-only">{t("login.token")}</label>
            <input autoComplete="off" name="token" id="token" className="form-control text-center" required
              placeholder={t("login.token")} type="text" />
          </div>
          <input type="submit" className="btn btn-primary" value={t("login.login")!} />
          {this.props.model.lastLoginAttempt &&
            <PromiseView promise={this.props.model.lastLoginAttempt}
              renderPending={() => <span>{t("loading")}</span>}
              renderRejected={(error) =>
                <div className="alert alert-danger" role="alert">
                  <strong>{t("login.error")}</strong> {error.response && error.response.data.message}
                </div>
              }
              renderFulfilled={() => null}
            />
          }
        </form>
      </div>
    );
  }
}
