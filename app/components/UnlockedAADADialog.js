import React from 'react';
import PropTypes from 'prop-types';
import AppDialog from './ui/AppDialog';
import classNames from 'classnames';
import style from './UnlockedAADADialog.module.scss';
import bgRect from '../assets/images/Rectangle 5.png';
import AppContainer from './ui/AppContainer';

function UnlockedAADADialog({ isOpen, handleClose, handleActionClick, }) {
  const data = [
    { date: '01.01.2022', amount: 100 },
    { date: '01.01.2022', amount: 100 },
    { date: '01.01.2022', amount: 100 },
    { date: '01.01.2022', amount: 100 },
    { date: '01.01.2022', amount: 100 },
    { date: '01.01.2022', amount: 100 },
    { date: '01.01.2022', amount: 100 },
    { date: '01.01.2022', amount: 100 },
    { date: '01.01.2022', amount: 100 },
  ];
  const total = data.map(({ amount }) => amount).reduce((acc, currentVal) => {
    return acc + currentVal;
  }, 0);

  return (
    <AppDialog
      isOpen={isOpen}
      handleClose={handleClose}
      handleActionClick={handleActionClick}
      className={style.root}
    >
      <AppContainer className={classNames(style.wrapper, 'px-3 py-4')}>
        {data.map(({ date, amount }, i) => {
          return (
            <div className={classNames(style.row, 'd-flex flex-row justify-content-between py-2')} key={i}>
              <span className={classNames(style.colLeft, { [style.textDisabled]: i > 0 })}>{date}</span>
              <span className={classNames(style.colRight, { [style.textDisabled]: i > 0 })}>+{amount} AADA</span>
            </div>
          );
        })}
        
        <div className={classNames(style.rowSummary, 'd-flex flex-row justify-content-between pt-4')}>
          <span className={classNames(style.colSummaryLeft)}>Unlocked AADA</span>
          <span className={classNames(style.colSummaryRight)}>{total} AADA</span>
        </div>

        <div>
          <button className={classNames(style.actionClaimAada, 'd-block mx-auto mt-4')} onClick={handleActionClick}>
            CLAIM AADA
          </button>
        </div>
      </AppContainer>
    </AppDialog>
  );
}

UnlockedAADADialog.defaultProps = {

};

UnlockedAADADialog.propTypes = {

};

export default UnlockedAADADialog;
