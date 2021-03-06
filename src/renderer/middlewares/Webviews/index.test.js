import { expect } from 'chai';
import sinon from 'sinon';
import { ipcRenderer } from 'electron';

import WebviewHandler from '../../lib/webview-handler';
import {
  DISPLAY_WEBVIEW,
  HIDE_WEBVIEWS,
  RELOAD_WEBVIEW,
} from './types';
import * as actions from './actions';
import Webviews from './';

describe('middlewares/Webviews', () => {
  const sandbox = sinon.createSandbox();
  const next = sandbox.spy();
  const dispatch = sandbox.spy();

  beforeEach(() => {
    sandbox.stub(WebviewHandler, 'addWebview').callsFake(() => document.createElement('webview'));
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should call next action', () => {
    const action = { ac: 'tion' };

    Webviews({ dispatch })(next)(action);

    expect(next).to.have.been.calledWith(action);
  });

  it('should call monitorWebview upon first DISPLAY_WEBVIEW', () => {
    const name = 'jens';
    const mockAction = { mon: 'itor' };
    const mockWebview = document.createElement('webview');
    const darkTheme = true;
    const action = {
      type: DISPLAY_WEBVIEW,
      darkTheme,
      name,
    };
    sandbox.stub(actions, 'monitorWebview').returns(mockAction);
    WebviewHandler.addWebview.callsFake((n) => name === n && mockWebview);
    sandbox.stub(WebviewHandler, 'show');
    sandbox.stub(WebviewHandler, 'displayView');

    Webviews({ dispatch })(next)(action);

    expect(actions.monitorWebview).to.have.been.calledWith(mockWebview, name);
    expect(dispatch).to.have.been.calledWith(mockAction);

    actions.monitorWebview.resetHistory();
    dispatch.resetHistory();

    Webviews({ dispatch })(next)(action);

    expect(actions.monitorWebview).to.not.have.been.called;
    expect(dispatch).to.not.have.been.called;
  });

  it('should listen for ipc-message event upon first DISPLAY_WEBVIEW', () => {
    const mockWebview = document.createElement('webview');
    sandbox.stub(mockWebview, 'addEventListener');
    const action = {
      type: DISPLAY_WEBVIEW,
      darkTheme: true,
      name: 'ingegerd',
    };
    sandbox.stub(actions, 'monitorWebview');
    WebviewHandler.addWebview.returns(mockWebview);
    sandbox.stub(WebviewHandler, 'show');
    sandbox.stub(WebviewHandler, 'displayView');
    sandbox.stub(ipcRenderer, 'send');

    Webviews({ dispatch })(next)(action);

    expect(mockWebview.addEventListener).to.have.been.calledWith('ipc-message', sinon.match.func);

    const mockEvent = { channel: 'notificationClick' };
    mockWebview.addEventListener.getCalls()
      .find(call => call.args[0] === 'ipc-message')
      .args[1](mockEvent);

    expect(ipcRenderer.send).to.have.been.calledWith('notificationClick', mockEvent);
  });

  it('should call WebviewHandler upon DISPLAY_WEBVIEW', () => {
    const name = 'matthew';
    sandbox.stub(WebviewHandler, 'show');
    sandbox.stub(WebviewHandler, 'displayView');

    const darkTheme = true;
    Webviews({ dispatch })(next)({
      type: DISPLAY_WEBVIEW,
      darkTheme,
      name,
    });

    expect(WebviewHandler.show).to.have.been.calledWith();
    expect(WebviewHandler.displayView).to.have.been.calledWith(name, {
      classNames: {
        darkTheme
      },
    });
  });

  it('should add a window event listener upon DISPLAY_WEBVIEW', () => {
    sandbox.stub(window, 'addEventListener');
    Webviews({ dispatch })(next)({
      type: DISPLAY_WEBVIEW,
      name: '',
    });

    expect(window.addEventListener).to.have.been.calledWith('focus', WebviewHandler.focusActive);
  });

  it('should call WebviewHandler upon HIDE_WEBVIEWS', () => {
    sandbox.stub(WebviewHandler, 'hide');
    Webviews({ dispatch })(next)({
      type: HIDE_WEBVIEWS,
    });

    expect(WebviewHandler.hide).to.have.been.calledWith();
  });

  it('should remove window event listener upon HIDE_WEBVIEWS', () => {
    sandbox.stub(WebviewHandler, 'hide');
    sandbox.stub(window, 'removeEventListener');
    Webviews({ dispatch })(next)({
      type: HIDE_WEBVIEWS,
    });

    expect(window.removeEventListener).to.have.been.calledWith('focus', WebviewHandler.focusActive);
  });

  it('should call WebviewHandler upon RELOAD_WEBVIEW', () => {
    const name = 'amanda';
    sandbox.stub(WebviewHandler, 'show');
    sandbox.stub(WebviewHandler, 'reload');
    Webviews({ dispatch })(next)({
      type: RELOAD_WEBVIEW,
      name,
    });

    expect(WebviewHandler.show).to.have.been.calledWith();
    expect(WebviewHandler.reload).to.have.been.calledWith(name);
  });
});
