import classNames from 'classnames';
import React from 'react';
import AppContainer from '../components/ui/AppContainer';
import style from './dashboard.module.scss';
import Dashboard from '../components/dashboard/Dashboard';

export default function Positions() {
  return (
    <AppContainer className={classNames(style.root)}>
      <Dashboard/>
    </AppContainer>
  );
}
