import React, { useState } from 'react';
import style from './WalletConnectionDialog.module.scss';
import classNames from 'classnames';
import { Modal, Spinner } from 'react-bootstrap';
import AppContainer from './ui/AppContainer';
import { MDBModal } from 'mdbreact';

import walletFlint from '../assets/images/logos/WalletFlint.png';
import walletEternl from '../assets/images/logos/WalletEternl.png';
import walletNami from '../assets/images/logos/WalletNami.png';
import walletGero from '../assets/images/logos/WalletGero.ico';

export default function WalletConnectionDialog({ close, connect }) {
  const [isLoading, setIsLoading] = useState(false);

  function handleConnect(wallet) {
    setIsLoading(true);
    connect(wallet);
  }

  function handleClose() {
    setIsLoading(false);
    close();
  }

  return (
    <MDBModal isOpen={true} toggle={handleClose} size="fluid" centered>
      {isLoading ? (
        <Spinner animation='border'  style={{color:'white'}}/>
      ) : (
        <AppContainer className={classNames(style.root)}>
          <section className={classNames(style.header)}>
            <p className={classNames('p-0 m-0')}>Connect your wallet</p>
            <a className={classNames(style.closeIcon)} onClick={handleClose}>&#10006;</a>
          </section>

          <section className={classNames(style.body)}>
            {/* <div onClick={() => handleConnect('flint')}>
              Flint <img width={'20px'} src={walletFlint} className={classNames('')} />
            </div> */}
            <div onClick={() => handleConnect('nami')}>
              Nami <img width={'20px'} src={walletNami} className={classNames('')} />
            </div>
            <div onClick={() => handleConnect('eternl')}>
              Eternl/CCVAULT <img width={'20px'} src={walletEternl} className={classNames('')} />
            </div>
            {/* <div onClick={() => handleConnect('gero')}>            
              Gero <img width={'20px'} src={walletGero} className={classNames('')} />
            </div> */}
          </section>
        </AppContainer>
      )}
    </MDBModal>
  );
}

