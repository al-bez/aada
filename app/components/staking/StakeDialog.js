
import style from './StakeDialog.module.scss';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import AppContainer from '../ui/AppContainer';

import { Form, Button, Modal, Spinner, ButtonGroup } from 'react-bootstrap';
import RangeSlider from 'react-bootstrap-range-slider';

import _ from 'underscore';

import classNames from 'classnames';
import stakeHelper from './stake.helper';
import AADALogoDialog from '../../assets/images/AADALogoDialog.svg';
import ArrowUpRight from '../../assets/images/ArrowUpRight.svg';
import * as notify from '../../client/services/notification.service';

function StakeDialog({ close, stakingAmount }) {
  const [state, setState] = useState({
    monthsFlag: false,
    amount: null,
    amountDisplayInput: null,
    range: 0,
    maxStakeAmount: 0,
    balance: 0
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [amtInputInvalid, setAmtInputInvalid] = useState(false);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      if (stakeHelper.isConnected()) {
        const maxStakeAmount = await getMaxStakeAmount(state.monthsFlag);
        const balance = await stakeHelper.getBalanceStake();
        setState({
          ...state,
          maxStakeAmount,
          balance,
        });
        setIsLoading(false);
        return;
      }
      notify.showError({
        message: 'Your wallet is not connected!', cb: () => {
          close();
          setIsLoading(false);
        }
      });
    })();
  }, []);

  useEffect(() => {
    setAmtInputInvalid(false);
  }, [state.amount]);

  const generateNftBond = async () => {
    try {
      const amount = state.amount;
      const months = state.monthsFlag ? 12 : 6;
      setIsLoading(true);
      const res = await stakeHelper.stake({ amount, months });
      setIsLoading(false);
      if (res?.success) {
        close(res.txHash);
      }
    } catch (err) {
      setIsLoading(false);
    }
  };

  const getAmountWithInterestRate = () => {
    const result = 0;
    if (state.monthsFlag) {
      result = state.amount * 1.20;
    } else {
      result = state.amount * 1.06;
    }
    return result;
  };
  

  const getAmountWithInterestRateUI = () => {
    const result = getAmountWithInterestRate();
    return amountToUSFormat(result, 2) || 0;
  };

  const toFixedNoRound = (number, precision = 5) => {
    const factor = Math.pow(10, precision);
    return Math.floor(number * factor) / factor;
  };

  const amountToUSFormat = (amount, precision = 6) => {
    if (_.isNumber(amount) && amount !== 0) {
      return amount.toLocaleString("en-US", { maximumFractionDigits: precision });
    }
    return '';
  };

  const setAmount = (ev) => {
    const value = ev.target.value;;
    const valueUSFormat = value.replaceAll(",", "");
    if (isNaN(valueUSFormat)) {
      return;
    };

    const amount = Number(Number(valueUSFormat).toFixed(6));
    const amountDisplayInput = (value.length && (value.endsWith('.') || value.endsWith('.0') || value.endsWith('.00') || value.endsWith('.000') || value.endsWith('.0000') || value.endsWith('.00000') || value.endsWith('.000000'))) && value;
    if (amount <= state.maxStakeAmount) {
      setState({
        ...state,
        amount,
        amountDisplayInput,
        range: (amount * 100) / state.maxStakeAmount,
      });
      return;
    }

    setState({
      ...state,
      amount: state.maxStakeAmount,
      range: 100,
    });
  };

  const setRange = (range) => {
    const maxStakeAmount = state.maxStakeAmount || 0;
    const amount = (maxStakeAmount / 100) * range;
    setState({
      ...state,
      range,
      amount
    });
  };

  const renderHeader = () => {
    const summaryHeader = (
      <Modal.Header className={classNames(style.topBarSummary)}>
        <p className={classNames(style.title)}>SUMMARY</p>
        <a className={classNames(style.closeIcon, 'text-decoration-none')} onClick={() => setShowSummary(false)}>
          &#10006;
        </a>
      </Modal.Header>
    );

    const defaultHeader = (
      <Modal.Header className={classNames(style.topBar)}>
        <img src={AADALogoDialog}></img>
        {/* <a href="#" className={classNames(style.action)}>
          View Staking Contract
          &nbsp;
          <img className={classNames('mb-1')} src={ArrowUpRight} width={'17px'}></img>
        </a> */}
        <a className={classNames(style.closeIcon, 'text-decoration-none')} onClick={() => close()}>
          &#10006;
        </a>

      </Modal.Header>
    );

    return showSummary ? summaryHeader : defaultHeader;
  };

  const getAADADateAvailable = ({ time } = {}) => {
    const sixMonthsMilli = 15778800000;
    // const now = Date.now();
    const now = new Date();
    let futureDate = null;
    if (!state.monthsFlag) {
      now.setMonth(now.getMonth() + 6);
      futureDate = now;
      // futureDate = new Date(now + sixMonthsMilli);
    }
    if (state.monthsFlag) {
      now.setMonth(now.getMonth() + 12);
      futureDate = now;
      // futureDate = new Date(now + (sixMonthsMilli * 2));
    }
    if (!futureDate) {
      futureDate = new Date(-8640000000000000);;
    }

    const year = futureDate.getUTCFullYear();
    const month = futureDate.getUTCMonth() + 1;
    const date = futureDate.getUTCDate();
    const hours = futureDate.getUTCHours();
    const min = futureDate.getUTCMinutes();
    const sec = futureDate.getUTCSeconds();

    // if (time) {
    //   return `${year}-${month}-${date}, ${hours}:${min}:${sec}`;
    // }
    return `${year}-${month}-${date}`;
  };

  const renderBody = () => {
    const bodySummary = (
      <Modal.Body className={classNames(style.bodySummary)}>
        <AppContainer className={classNames('d-flex flex-column')}>
          <div className={classNames(style.summaryInfo, 'mb-4')}>
            <p>
              <strong className={classNames(style.highlight)}>
                {_.isNumber(state.amount) ? amountToUSFormat(state.amount) : 0} AADA
              </strong> will be staked and converted to NFT
            </p>
            <p>
              <strong className={classNames(style.highlight)}>
                {getAmountWithInterestRateUI()} AADA
              </strong> will be claimable from {getAADADateAvailable({ time: true })} UTC
            </p>
          </div>
          <div className={classNames(style.summaryWarning, 'mb-4')}>
            <span className={classNames(style.highlight)}>Warning!</span> No external audits were made. Use at your own risk
          </div>
          <div className={classNames(style.summaryActions, 'w-100 d-flex gap-4')}>
            <Button className={classNames(style.actionConfirm, 'w-100')} onClick={() => generateNftBond()}>Confirm</Button>
            <Button className={classNames(style.actionDecline, 'w-100')} onClick={() => setShowSummary(false)}>Decline</Button>
          </div>
        </AppContainer>
      </Modal.Body>
    );
    if (showSummary) {
      return bodySummary;
    }

    return (
      <Modal.Body className={classNames(style.body)}>
        <AppContainer className={classNames('d-flex flex-column')}>
          <Form className='d-flex flex-column w-100 mt-1'>
            <Form.Group className="d-flex flex-column align-items-center mb-4" controlId="1" >
              <Form.Label className={classNames(style.inputLabel, 'w-100 text-left mb-3')}>
                How much AADA you want to stake?
              </Form.Label>
              <Form.Control
                className={classNames(style.amountInput, { [style.amtInputInvalid]: amtInputInvalid }, 'w-100')}
                type="text"
                placeholder={`(max: ${amountToUSFormat(state.maxStakeAmount, 2) || 0})`}
                // value={amountToUSFormat(state.amount)}
                value={state.amountDisplayInput || amountToUSFormat(state.amount)}
                onChange={setAmount}
                isInvalid={!userHasBalance()}
              />
              <Form.Control.Feedback type="invalid" >
                You don’t have any AADA
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="d-flex flex-column">
              <RangeSlider
                className={classNames(style.rangeSlider, 'w-100')}
                tooltipLabel={val => `${toFixedNoRound(val, 2)}%`}
                value={state.range}
                onChange={ev => setRange(ev.target.value)}
                tooltipProps={{ className: 'text-light' }}
              />
            </Form.Group>

            <Form.Group className="d-flex justify-content-center gap-1 my-4 pb-1">
              <Form.Label className={classNames(style.monthsFlagBtn, { [style.active]: !state.monthsFlag })} role="button" onClick={() => {
                const monthsFlag = false;
                if (monthsFlag === state.monthsFlag) {
                  return;
                }
                setIsLoading(true);
                getMaxStakeAmount(monthsFlag).then(maxStakeAmount => {
                  setState({
                    ...state,
                    monthsFlag,
                    maxStakeAmount
                  });
                  setIsLoading(false);
                });
              }}>
                6 months
              </Form.Label>
              <Form.Label className={classNames(style.monthsFlagBtn, { [style.active]: state.monthsFlag })} role="button" onClick={() => {
                const monthsFlag = true;
                if (monthsFlag === state.monthsFlag) {
                  return;
                }
                setIsLoading(true);
                getMaxStakeAmount(monthsFlag).then(maxStakeAmount => {
                  setState({
                    ...state,
                    monthsFlag,
                    maxStakeAmount
                  });
                  setIsLoading(false);
                });
              }}>
                12 months
              </Form.Label>
            </Form.Group>

            <Form.Group className="mb-4 d-flex justify-content-center">
              <Form.Label className={classNames(style.calculatedSummary, 'w-auto text-center mb-3')}>
                You will get <strong className={classNames(style.highlight)}>{getAmountWithInterestRateUI()} AADA</strong> on {getAADADateAvailable()}
              </Form.Label>
            </Form.Group>

            <Form.Group className="text-center w-100">
              <ButtonGroup className={classNames('mb-3 w-100 d-flex gap-4')}>
                <a href="#" className={classNames(style.actionGenerateNFTBond, 'w-50')} onClick={() => {
                  // todo uncomment
                  // if (state.amount && state.amount >= 25) {
                  if (state.amount) {
                    if (process.env.NEXT_PUBLIC_IS_LOCALHOST) {
                      setShowSummary(true);
                      return;
                    }
                    if (state.amount >= 25) {
                      setShowSummary(true);
                      return;
                    }
                  }
                  setAmtInputInvalid(true);
                  notify.showError({ message: 'Stake minimum is 25 AADA!' });
                }}>
                  Generate NFT-bond
                </a>
                <a className={classNames(style.actionGetAADA, 'w-50')} href="https://app.minswap.org/swap?currencySymbolA=&tokenNameA=&currencySymbolB=8fef2d34078659493ce161a6c7fba4b56afefa8535296a5743f69587&tokenNameB=41414441" target={'_blank'} rel="noreferrer">
                  GET AADA
                </a>
              </ButtonGroup>
              <div className={classNames(style.bottomSummary)}>
                <p className={classNames('p-0 m-0')}>
                  After submitting transaction your funds will be locked for {state.monthsFlag ? 12 : 6} months
                </p>
              </div>
            </Form.Group>
          </Form>
        </AppContainer>
      </Modal.Body>
    );
  };

  return (
    <>
      <Modal show={true} onHide={() => close()} centered>
        <section className={style.root}>
          {renderHeader()}
          {renderBody()}
        </section>
      </Modal>
      <Modal show={isLoading} centered style={{ background: 'rgba(0,0,0,0.5)' }}>
        <Modal.Body>
          <Spinner animation='border' variant='light' style={{ color: '#28ebdd', margin: 'auto' }} />
        </Modal.Body>
      </Modal>
    </>
  );

  function userHasBalance() {
    const balance = state.balance;
    return _.isNumber(balance) && balance > 0;
  }

  async function getMaxStakeAmount(monthsFlag) {
    try {
      const { months6Remaining, months12Remaining } = stakingAmount;
      const totalRemaining = monthsFlag ? months12Remaining : months6Remaining;
      const balance = await stakeHelper.getBalanceStake();
      const maxStakeAmount = balance < totalRemaining
        ? balance
        : totalRemaining;

      return maxStakeAmount <= 0
        ? 0
        : maxStakeAmount / 1000000;
    } catch (err) {
      return 0;
    }
  }
}

StakeDialog.defaultProps = {
  isOpen: false,
  stakingAmount: null,
};

StakeDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  submit: PropTypes.func.isRequired,
  close: PropTypes.func.isRequired,
  stakingAmount: PropTypes.object,
};

export default StakeDialog;