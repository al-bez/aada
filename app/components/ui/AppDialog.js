import React, { useState } from 'react';
import PropTypes from 'prop-types';
import style from './AppDialog.module.scss';
import AppContainer from './AppContainer';
import classNames from 'classnames';
import { MDBContainer, MDBModal, MDBModalBody, MDBModalHeader, MDBModalFooter, MDBIcon } from 'mdbreact';

function AppDialog({
  children,
  size,
  isOpen,
  handleClose,
  title,
  className,
}) {
  return (
    <div className={classNames(style._root, { [style.isOpen]: isOpen })}>
      <MDBContainer>
        <MDBModal isOpen={isOpen} fullHeight={true} size={size} centered toggle={handleClose}>
          <AppContainer className={classNames(style.container, className)}>
            {title && (
              <div className={classNames(style.header)}>
                <a className={classNames(style.closeIcon)} onClick={handleClose}>&#10006;</a>
                <p className={classNames(style.title)}>
                  {title}
                </p>
              </div>
            )}
            <div className={classNames(style.body)}>
              {children}
            </div>
          </AppContainer>
        </MDBModal>
      </MDBContainer>
    </div>
  );
}

AppDialog.defaultProps = {
  className: '',
  headerStyle: {},
  size: 'md'
};

AppDialog.propTypes = {
  className: PropTypes.string,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'fluid']),
  isOpen: PropTypes.bool.isRequired,

  title: PropTypes.string,
  handleActionClick: PropTypes.func,
  handleClose: PropTypes.func,
};

export default AppDialog;
