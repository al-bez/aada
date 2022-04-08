
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AppContainer from '../ui/AppContainer';
import style from './MyPositions.module.scss';
import classNames from 'classnames';
import logoSm from '../../assets/images/positions/logo-sm.png';
import arrowDown from '../../assets/images/positions/arrow-down.png';
import cardanoService from '../../client/services/cardano.service';
import helper from './positions.helper';
import { showError } from '../../client/services/notification.service';
import { Spinner } from 'react-bootstrap';
import { useRouter } from 'next/router';
import * as routes from '../../const/routes.const';

function MyPositions(props) {
  const router = useRouter();

  const [state, setState] = useState({
    positions: [],
    isLoading: true,
  });

  const [order, setOrder] = useState({
    lockedAmount: false,
    unlockDate: false,
    APY: false,
    totalUnlockAmount: false,
  });

  const [orderBy, setOrderBy] = useState(null);



  useEffect(() => {
    if (helper.connected) {
      loadPositions();
      return;
    }
    showError({ message: 'Connect your wallet to see your positions!' });
    router.push(routes.HOME).then(() => {
    });
  }, []);

  async function loadPositions() {
    const data = await helper.getStakingNftBonds();
    if (Array.isArray(data)) {
      setState({
        ...state,
        positions: data,
        isLoading: false,
      });
    }
  }

  async function handleSort(colName) {
    setOrderBy(colName);
    setOrder({
      ...order,
      [colName]: !order[colName]
    });
  }

  let positions = state.positions.map(position => {
    const {
      token_name, token_nice_name, token_policy, locked_amount,
      lock_ts, unlock_ts, total_unlock_amount, tx_hash
    } = position;
    const lockedAmount = locked_amount / 1000000;
    const lockDate = new Date(lock_ts * 1000);
    const unlockDate = new Date(unlock_ts * 1000);
    const differenceMilli = unlockDate - lockDate;
    const differenceMonths = Math.round(differenceMilli * 3.80517e-10);
    const APY = differenceMonths === 6 ? 12 : 20;
    const totalUnlockAmount = Number(total_unlock_amount / 1000000);

    return {
      lockedAmount,
      lockDate,
      unlockDate,
      differenceMilli,
      differenceMonths,
      APY,
      totalUnlockAmount
    };
  });

  if (orderBy) {
    positions = positions.sort((a, b) => {
      const A = a[orderBy];
      const B = b[orderBy];
      return order[orderBy]
        ? A - B
        : B - A;
    });
  }

  const isEmpty = positions.length === 0;

  return (
    <AppContainer className={classNames(style.root, 'p-0 m-0')}>
      <section className={classNames(style.head)}>
        <div>
          Locked amount
          &nbsp;
          <img src={arrowDown} className={classNames(style.sortArrow, { [style.rotate]: order.lockedAmount})} onClick={() => handleSort('lockedAmount')} />
        </div>
        <div>
          Unlock date
          &nbsp;
          <img src={arrowDown} className={classNames(style.sortArrow, { [style.rotate]: order.unlockDate})} onClick={() => handleSort('unlockDate')} />
        </div>
        <div>
          APY
          &nbsp;
          <img src={arrowDown} className={classNames(style.sortArrow, { [style.rotate]: order.APY})} onClick={() => handleSort('APY')} />
        </div>
        <div>
          Total amount
          &nbsp;
          <img src={arrowDown} className={classNames(style.sortArrow, { [style.rotate]: order.totalUnlockAmount})} onClick={() => handleSort('totalUnlockAmount')} />
        </div>
        <div></div>
      </section>

      {state.isLoading ? (
        <Spinner animation='border' className={classNames('m-auto')} style={{ color: 'white' }} />
      ) : (
        <section className={classNames(style.body, { 'h-auto py-3': isEmpty })}>
          {isEmpty && <h1 className={classNames(style.emptyMessage, 'text-light m-auto')}>
            {`You don't have any positions yet`}
          </h1>}
          {positions.map((position, i) => {
            const { lockedAmount, lockDate, unlockDate, differenceMilli, differenceMonths, APY, totalUnlockAmount } = position;
            return (
              <div className={classNames(style.row)} key={i}>
                <div className={classNames(style.cell, style.lockedAmount)}>
                  <span className={classNames('')}>{lockedAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })}</span>
                  <span className={classNames(style.aadaLogoWrapper)} >
                    <img src={logoSm} className={classNames(style.aadaLogo)} />
                  </span>
                </div>

                <div className={classNames(style.cell)}>
                  {unlockDate.toLocaleDateString()}
                </div>

                <div className={classNames(style.cell, style.highlight)}>
                  {APY.toFixed(2)}%
                  {/* 12.00% */}
                </div>

                <div className={classNames(style.cell, style.highlight)}>
                  {totalUnlockAmount.toLocaleString("en-US", { maximumFractionDigits: 4 })}
                </div>

                <div className={classNames(style.cell, 'm-auto')}>
                  <button className={classNames(style.cellAction, '')} onClick={() => alert('claim')} disabled>
                    CLAIM
                  </button>
                </div>
              </div>
            );
          })}
        </section>
      )}

    </AppContainer >
  );
}

MyPositions.propTypes = {};
MyPositions.defaultProps = {};

export default MyPositions;
