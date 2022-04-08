import AppContainer from '../components/ui/AppContainer';
import classNames from 'classnames';
import style from './staking.module.scss';
import StakeDialog from '../components/staking/StakeDialog';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import cardanoService from '../client/services/cardano.service';
import _ from 'underscore';
import { Spinner } from 'react-bootstrap';
import * as routes from '../const/routes.const';
import TransactionSuccessDialog from '../components/TransactionSuccessDialog';

const Staking = () => {
  const router = useRouter();
  const history = router.history;
  const [stakingAmount, setStakingAmount] = useState(null);
  const [showStakeDialog, setShowStakeDialog] = useState(false);
  const [successTxHash, setSuccessTxHash] = useState(null);
  const [showTransactionSuccessDialog, setShowTransactionSuccessDialog] = useState(false);

  const [closeTime, setCloseTime] = useState({});

  useEffect(() => {
    cardanoService.getNftStakingTotal().then(resData => {
      setStakingAmount(resData);
    });
    updateRemainingCloseTime();
  }, []);

  function updateRemainingCloseTime() {
    const remaining = getCloseTime();
    setCloseTime(remaining);
    const oneMinInMilli = 60000;

    setTimeout(() => {
      updateRemainingCloseTime();
    }, oneMinInMilli);
  }


  function renderActionsWrapper() {
    return (
      <div className={classNames(style.actions)}>
        <button className={classNames(style.stake)} onClick={() => setShowStakeDialog(true)} disabled={stakingAmount === null}>
          STAKE
        </button>
        <button className={classNames(style.myPositions)} onClick={() => router.push(routes.POSITIONS)} >
          MY POSITIONS
        </button>
      </div >
    );
  };


  function renderStakeRow({ periodMonths, aprRate, totalLocked }) {
    const renderStakeCell = ({ elLeft, elCenter, elRight }) => (
      <div style={{ position: 'relative' }}>
        <div className={style.left}>{elLeft}</div>
        <div className={style.center}>{elCenter}</div>
        <div className={style.right}>{elRight}</div>
      </div>
    );

    const totalLimit = stakingAmount?.totalLimit / 1000000;
    return (
      <section className={classNames(style.stakeRow, {
        [style.months12]: periodMonths === 12,
        [style.months6]: periodMonths === 6
      })}>
        {renderStakeCell({
          elLeft: <h1 className={classNames(style.blue, style.textLg)}>{periodMonths} MONTHS STAKE</h1>
        })}
        {renderStakeCell({
          elCenter: <span className={classNames(style.white, style.textLg)}>APR {aprRate}%</span>,
          elRight: <>
            <p className={classNames(style.textMd)}>Closes in</p>
            <p><span className={classNames(style.timer)}>{closeTime.days} DAY : {closeTime.hours} HOURS : {closeTime.minutes} MIN</span></p>
          </>
        })}
        {renderStakeCell({
          elLeft: (
            <span className={classNames(style.textMd)}>{periodMonths} month lock period</span>
          ),
          elCenter: (
            <span className={classNames(style.textMd)}>
              {(isNaN(totalLocked) || isNaN(totalLimit))
                ? <Spinner animation='border' size='sm' />
                : `${(totalLocked / 1000000).toLocaleString('en-US')}/${totalLimit.toLocaleString('en-US')}`} LOCKED AADA
            </span>
          )
        })}
      </section>
    );
  }

  return (
    <AppContainer className={classNames(style.root)}>
      {renderStakeRow({ periodMonths: 6, aprRate: 12, totalLocked: stakingAmount?.months6 })}
      {renderStakeRow({ periodMonths: 12, aprRate: 20, totalLocked: stakingAmount?.months12 })}
      {renderActionsWrapper()}

      {showStakeDialog && (
        <StakeDialog
          close={txHash => {
            setShowStakeDialog(false);
            if (txHash) {
              setSuccessTxHash(txHash);
              setShowTransactionSuccessDialog(true);
            }
          }}
          submit={handleStakeDialogSubmit}
          stakingAmount={stakingAmount}
        />
      )}
      {showTransactionSuccessDialog && (
        <TransactionSuccessDialog
          transactionHash={successTxHash}
          close={() => {
            setSuccessTxHash(null);
            setShowTransactionSuccessDialog(false);
          }}
        />
      )}
    </AppContainer>
  );

  function handleStakeDialogSubmit(ev) {
    setShowStakeDialog(false);
  }

  function getCloseTime(period) {
    const sixMonthsMilli = 15778800000;
    const now = Date.now();
    const futureDate = new Date('2022-4-15 00:00:00 UTC');
    let future = futureDate.getTime();
    // if (period === 6) {
    //   future = now + sixMonthsMilli;
    // }
    // if (period === 12) {
    //   future = now + (sixMonthsMilli * 2);
    // }


    var delta = Math.abs(future - now) / 1000;
    var days = Math.floor(delta / 86400);
    delta -= days * 86400;

    var hours = Math.floor(delta / 3600) % 24;
    delta -= hours * 3600;

    var minutes = Math.floor(delta / 60) % 60;
    delta -= minutes * 60;

    // what's left is seconds
    var seconds = delta % 60;

    return { days, hours, minutes };
  }
};

export default Staking;

function _renderNumberValue(totalLocked) {
  return isNaN(totalLocked)
    ? <Spinner animation='border' size='sm' />
    : totalLocked.toLocaleString('en-US');
}

