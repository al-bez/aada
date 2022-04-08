import React, { useState } from 'react';
import style from './TransactionSuccessDialog.module.scss';
import classNames from 'classnames';
import { Button } from 'react-bootstrap';
import AppContainer from './ui/AppContainer';
import { MDBModal } from 'mdbreact';

import aadaLogo from '../assets/images/addaLogo.png';

export default function TransactionSuccessDialog({ transactionHash, close }) {
  const isTestnet = process.env.NEXT_PUBLIC_REACT_NETWORK === 'testnet';
  return (
    <MDBModal isOpen={true} toggle={close} size="fluid" centered>
      <AppContainer className={classNames(style.root)}>
        <section className={classNames(style.logo)}>
          <img src={aadaLogo} width="70px" />
        </section>

        <section className={classNames(style.body)}>
          <div className={classNames(style.message)}>
            <p className={classNames('p-0 m-0')}>Transaction successfully submitted</p>
          </div>
          
          <div className={classNames(style.actions)}>
            <a className={classNames(style.actionView)} href={`https://${isTestnet ? 'testnet.' : ''}cardanoscan.io/transaction/${transactionHash}`} target={'_blank'} rel="noreferrer">
              View on explorer
            </a>
            <Button size='sm' className={classNames(style.actionClose)} onClick={close}>Close</Button>
          </div>
        </section>
      </AppContainer>
    </MDBModal>
  );
}

