import classNames from 'classnames';
import React from 'react';
import AppContainer from '../components/ui/AppContainer';
import style from './positions.module.scss';
import MyPositions from '../components/positions/MyPositions';

export default function Positions() {
  return (
    <AppContainer className={classNames(style.root)}>
      <MyPositions />
    </AppContainer>
  );
}
