import React from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import PropTypes from 'prop-types';
import AppDialog from './ui/AppDialog';
import classNames from 'classnames';
import style from './WalletConfirmDialog.module.scss';
import AppContainer from './ui/AppContainer';
const WalletConfirmDialog = ({
  title,
  textTokens,
  subTitle,
  textBtn,
  handleActionClick,
}) => {

  function handleClose() {
    handleActionClick(false);
  }

  function handleClick() {
    handleActionClick(true);
  }

  function renderTooltip(props) {
    return (
      <Tooltip {...props}>
        Click to Copy
      </Tooltip>
    );
  }


  function renderSubtitle() {
    return (
      <p className={classNames(style.text)}>{subTitle}</p>
    );
  }

  function renderContent() {
    function renderTextRow(text) {
      return (
        <p className={classNames(style.text, 'mb-2')}>{text}</p>
      );
    }
    function renderCopyRow(textCopy) {
      return (
        <OverlayTrigger overlay={renderTooltip}>
          <CopyToClipboard text={textCopy}>
            <p className={classNames(style.textCopy, 'mb-2')}>{textCopy}</p>
          </CopyToClipboard>
        </OverlayTrigger>
      );
    }
    return (
      <AppContainer className={classNames(style.content, 'mb-0 mt-2')}>
        {textTokens.map((t, i) => {
          const { text, copy } = t;
          return (
            <AppContainer key={i}>
              {text
                ? renderTextRow(text)
                : renderCopyRow(copy)}
            </AppContainer>
          );
        })}
      </AppContainer>
    );
  }

  function renderAction() {
    return (
      <AppContainer>
        <button className={classNames(`btn-animated-btn mb-3`, { 'mt-3': !!subTitle })} onClick={handleClick}>
          {textBtn}
        </button>
      </AppContainer>
    );
  }

  return (
    <AppDialog
      isOpen={true}
      title={title}
      handleClose={handleClose}
      className={classNames(style.root, { [style.rootMd]: !!subTitle })}
      size="fluid"    
    >
      <AppContainer className={classNames(style.wrapper)}>
        {subTitle && renderSubtitle()}
        {renderAction()}
        {renderContent()}
      </AppContainer>
    </AppDialog>
  );
};

WalletConfirmDialog.propTypes = {
  title: PropTypes.string.isRequired,
  subTitle: PropTypes.string,
  textBtn: PropTypes.string.isRequired,
  textTokens: PropTypes.array.isRequired,
  handleActionClick: PropTypes.func.isRequired,
};

export default WalletConfirmDialog;