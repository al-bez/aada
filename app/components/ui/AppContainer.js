import React from 'react';
import PropTypes from 'prop-types';
import classes from './AppContainer.module.scss';
import classNames from 'classnames';

function AppContainer({ children, className, ...otherProps }) {
  return (
    <section {...otherProps} className={classNames(classes.root, className)}>
      {children}
    </section>
  );
}

AppContainer.propTypes = {
  className: PropTypes.string,
};

AppContainer.defaultProps = {
  className: ''
};

export default AppContainer;
