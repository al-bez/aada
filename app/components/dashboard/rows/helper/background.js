import style from "../../Dashboard.module.scss"

import classNames from "classnames"

const mapStatusToStyle = {
  "Waiting to be funded": style.waitingBackground,
  "Debt": style.debtBackground,
  "Loan": style.loanBackground,
  "Repayed": style.inactiveBackground,
  "Liquidated": style.inactiveBackground,
}

export const Background = ({ status }) => {
  const styleName = mapStatusToStyle[status]
  return <div className={classNames(style.background, styleName)}/>
}
