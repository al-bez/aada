import React from 'react';
import PropTypes from 'prop-types';
import AppDialog from './ui/AppDialog';
import classNames from 'classnames';
import style from './AddressInputSuccessDialog.module.scss';


function AddressInputSuccessDialog({ title, isOpen, handleClose, handleActionClick, }) {
  return (
    <AppDialog
      isOpen={isOpen}
      title={title}
      handleClose={handleClose}
      className={classNames(style.root)}
    >
      <div className={classNames(style.wrapper)}>
        <p className={classNames(style.address)}>ADDR1QXY</p>
        <p className={classNames(style.description)}>
          Send <span style={{ color: '#28EBDD' }}>50$</span> Amount of ADA to given address to claim your AADA
        </p>
        <button
          className={classNames(style.actionBtn, 'd-block mx-auto mt-4')}
          onClick={handleActionClick}>
          OKAY
        </button>
      </div>
    </AppDialog>
  );
}

AddressInputSuccessDialog.defaultProps = {
};

AddressInputSuccessDialog.propTypes = {
  title: PropTypes.string,
  error: PropTypes.bool,
  isOpen: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleActionClick: PropTypes.func.isRequired,
};

export default AddressInputSuccessDialog;
