import React from 'react';
import PropTypes from 'prop-types';
import AppDialog from './ui/AppDialog';
import classNames from 'classnames';
import style from './AddressInputDialog.module.scss';


function AddressInputDialog({ title, isOpen, error, handleClose, handleActionClick, }) {
  return (
    <AppDialog
      isOpen={isOpen}
      title={title}
      handleClose={handleClose}
      handleActionClick={handleActionClick}
      className={style.root}
    >
      <div className={classNames(style.wrapper)}>
        <label className={classNames(style.label, 'd-block mb-3')}>
          Your wallet adress
        </label>

        <input className={classNames(style.input, 'd-block mb-1', { [style.inputError]: error })} placeholder={'Wallet adress'} />

        <p className={classNames(style.error, 'pl-1', { [style.invisible]: !error })}>You can not claim AADA</p>

        <button className={classNames(style.actionCheck, 'd-block mx-auto mt-4', { [style.disabled]: error })} onClick={handleActionClick}>
          CHECK
        </button>
      </div>
    </AppDialog>
  );
}

AddressInputDialog.defaultProps = {
};

AddressInputDialog.propTypes = {
  title: PropTypes.string,
  error: PropTypes.bool,
  isOpen: PropTypes.bool.isRequired,
  handleClose: PropTypes.func.isRequired,
  handleActionClick: PropTypes.func.isRequired,
};

export default AddressInputDialog;
